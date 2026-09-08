import type { GhostApplication, GhostStatus } from '../types/ghost';
import type { RelocationPlace } from '../types/place';
import type { GhostMatchResult, PlaceMatchEvaluation } from '../types/matching';
import { evaluatePlaceForGhost } from './evaluator';

export interface AllocationState {
  ghostResults: Record<string, GhostMatchResult>;
  placeOccupants: Record<string, string[]>; // placeId -> array of ghostIds assigned
}

/**
 * Вычисляет приоритет заявки в очереди:
 * 1. Просроченные (< 0 часов) — наивысший приоритет
 * 2. Срочные (< 24 часов)
 * 3. Высокая тревожность
 * 4. Оставшееся время дедлайна
 */
export function calculateGhostPriority(ghost: GhostApplication): number {
  let priority = 1000;

  if (ghost.deadlineHoursLeft < 0) {
    // Чем сильнее просрочено, тем выше приоритет
    priority += 10000 + Math.abs(ghost.deadlineHoursLeft) * 10;
  } else if (ghost.deadlineHoursLeft < 24) {
    priority += 5000 + (24 - ghost.deadlineHoursLeft) * 50;
  } else if (ghost.deadlineHoursLeft < 48) {
    priority += 2000 + (48 - ghost.deadlineHoursLeft) * 20;
  } else {
    priority += Math.max(0, 1000 - ghost.deadlineHoursLeft);
  }

  if (ghost.anxietyLevel === 'high') priority += 300;
  if (ghost.anxietyLevel === 'medium') priority += 100;

  return priority;
}

/**
 * Детерминированное пакетное распределение с обработкой конкуренции за ограниченные места
 */
export function allocateGhostsToPlaces(
  ghosts: GhostApplication[],
  places: RelocationPlace[]
): AllocationState {
  const placeOccupants: Record<string, string[]> = {};
  places.forEach(p => {
    placeOccupants[p.id] = [];
  });

  const ghostResults: Record<string, GhostMatchResult> = {};

  // 1. Сначала учитываем ручные назначения (Manual Overrides имеют безусловный приоритет)
  const manualAssignedGhosts = ghosts.filter(g => g.manualOverride && g.assignedPlaceId);
  const unassignedOrAutoGhosts = ghosts.filter(g => !g.manualOverride || !g.assignedPlaceId);

  for (const ghost of manualAssignedGhosts) {
    const placeId = ghost.assignedPlaceId!;
    if (placeOccupants[placeId]) {
      placeOccupants[placeId].push(ghost.id);
    }

    const evaluations: Record<string, PlaceMatchEvaluation> = {};
    for (const place of places) {
      evaluations[place.id] = evaluatePlaceForGhost(ghost, place);
    }

    ghostResults[ghost.id] = {
      ghostId: ghost.id,
      recommendedPlaceId: placeId,
      evaluations,
      status: 'assigned_manual',
      displacementReason: 'Назначено вручную оператором бюро'
    };
  }

  // 2. Сортируем оставшиеся заявки по приоритету (дедлайн + тревожность)
  const prioritizedGhosts = [...unassignedOrAutoGhosts].sort(
    (a, b) => calculateGhostPriority(b) - calculateGhostPriority(a)
  );

  // 3. Распределяем по местам
  for (const ghost of prioritizedGhosts) {
    const evaluations: Record<string, PlaceMatchEvaluation> = {};
    for (const place of places) {
      evaluations[place.id] = evaluatePlaceForGhost(ghost, place);
    }

    // Допустимые места (без hard conflicts)
    const eligiblePlaces = places
      .map(place => ({
        place,
        evaluation: evaluations[place.id]
      }))
      .filter(item => item.evaluation.isEligible)
      .sort((a, b) => b.evaluation.score - a.evaluation.score);

    if (eligiblePlaces.length === 0) {
      // Ни одно место физически не подходит
      const impossibleReasons: string[] = [];
      if (ghost.specialRequirements.requiresAttic && ghost.specialRequirements.requiresCellar) {
        impossibleReasons.push('Не существует локации с одновременным наличием чердака и подвала');
      }
      if (ghost.specialRequirements.isolatedFromHumans) {
        impossibleReasons.push('Все локации без людей не удовлетворяют другим обязательным условиям');
      }
      if (ghost.specialRequirements.noMirrors) {
        impossibleReasons.push('Все потенциально доступные локации оборудованы зеркалами');
      }
      if (impossibleReasons.length === 0) {
        impossibleReasons.push('Отсутствует локация, удовлетворяющая обязательным условиям привидения');
      }

      ghostResults[ghost.id] = {
        ghostId: ghost.id,
        recommendedPlaceId: null,
        evaluations,
        status: 'impossible',
        impossibleReasons
      };
      continue;
    }

    // Ищем место со свободной вместимостью
    let assignedPlaceId: string | null = null;
    let displacementReason: string | undefined = undefined;
    const bestChoice = eligiblePlaces[0];

    for (let i = 0; i < eligiblePlaces.length; i++) {
      const { place } = eligiblePlaces[i];
      const currentCount = placeOccupants[place.id]?.length || 0;

      if (currentCount < place.capacity) {
        assignedPlaceId = place.id;
        placeOccupants[place.id].push(ghost.id);

        if (i > 0) {
          displacementReason = `Первое по совместимости место «${bestChoice.place.name}» (Score: ${bestChoice.evaluation.score}) уже заполнено более приоритетными заявками. Назначена альтернатива «${place.name}».`;
        }
        break;
      }
    }

    if (assignedPlaceId) {
      const isCriticalUrgency = ghost.deadlineHoursLeft <= 24;
      const status: GhostStatus = isCriticalUrgency ? 'needs_attention' : 'assigned_auto';

      ghostResults[ghost.id] = {
        ghostId: ghost.id,
        recommendedPlaceId: assignedPlaceId,
        evaluations,
        status,
        displacementReason
      };
    } else {
      // Подходящие места были, но все они переполнены
      const occupiedNames = eligiblePlaces.map(p => `«${p.place.name}»`).join(', ');
      ghostResults[ghost.id] = {
        ghostId: ghost.id,
        recommendedPlaceId: null,
        evaluations,
        status: 'impossible',
        impossibleReasons: [
          `Все совместимые места (${occupiedNames}) полностью заполнены заявками с более высоким приоритетом дедлайна.`
        ]
      };
    }
  }

  return {
    ghostResults,
    placeOccupants
  };
}
