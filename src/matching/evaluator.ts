import type { GhostApplication, TemperaturePreference } from '../types/ghost';
import type { RelocationPlace } from '../types/place';
import type { MatchFactor, PlaceMatchEvaluation } from '../types/matching';

const TEMPERATURE_ORDER: TemperaturePreference[] = ['freezing', 'cold', 'cool', 'moderate', 'warm'];

export function evaluatePlaceForGhost(
  ghost: GhostApplication,
  place: RelocationPlace
): PlaceMatchEvaluation {
  const hardConflicts: MatchFactor[] = [];
  const warnings: MatchFactor[] = [];
  const pros: MatchFactor[] = [];

  // =========================================================================
  // 1. HARD CONSTRAINTS (Физические несовместимости)
  // Примечание: Дедлайн НЕ является hard constraint (он определяет приоритет)
  // =========================================================================

  // Изоляция от людей
  if (ghost.specialRequirements.isolatedFromHumans && place.humanPresence !== 'none') {
    const humanLabels: Record<string, string> = {
      rare: 'редко',
      sometimes: 'иногда',
      frequent: 'часто',
      constant: 'постоянно'
    };
    hardConflicts.push({
      category: 'humans',
      type: 'hard_conflict',
      message: `Присутствие людей (${humanLabels[place.humanPresence] || place.humanPresence}): нарушено обязательное условие изоляции`
    });
  }

  // Обязательный чердак
  if (ghost.specialRequirements.requiresAttic && !place.hasAttic) {
    hardConflicts.push({
      category: 'special_requirements',
      type: 'hard_conflict',
      message: 'В локации отсутствует чердак (обязательное условие привидения)'
    });
  }

  // Обязательный подвал
  if (ghost.specialRequirements.requiresCellar && !place.hasCellar) {
    hardConflicts.push({
      category: 'special_requirements',
      type: 'hard_conflict',
      message: 'В локации отсутствует подвал (обязательное условие привидения)'
    });
  }

  // Фобия зеркал
  if (ghost.specialRequirements.noMirrors && place.hasMirrors) {
    hardConflicts.push({
      category: 'special_requirements',
      type: 'hard_conflict',
      message: 'В локации установлены зеркала (критическая фобия зеркал)'
    });
  }

  const isEligible = hardConflicts.length === 0;

  // =========================================================================
  // 2. SOFT PREFERENCES (Мягкие предпочтения и расчет Score: 0-100)
  // =========================================================================
  let score = 100;

  // А) Температура
  const ghostTempIdx = TEMPERATURE_ORDER.indexOf(ghost.preferredTemperature);
  const placeTempIdx = place.type === 'Подземелье' || place.type === 'Склеп' 
    ? 0 // freezing/cold
    : place.type === 'Маяк' ? 1 
    : place.type === 'Библиотека' ? 3 
    : 2; // cool/moderate

  const tempDiff = Math.abs(ghostTempIdx - placeTempIdx);
  if (tempDiff === 0) {
    score += 0;
    pros.push({
      category: 'temperature',
      type: 'pro',
      message: 'Температурный режим идеально соответствует предпочтениям',
      deltaScore: 0
    });
  } else if (tempDiff === 1) {
    score -= 10;
    warnings.push({
      category: 'temperature',
      type: 'warning',
      message: 'Температура незначительно отличается от предпочтительной',
      deltaScore: -10
    });
  } else {
    score -= 25;
    warnings.push({
      category: 'temperature',
      type: 'warning',
      message: 'Ощутимое температурное расхождение с комфортной зоной',
      deltaScore: -25
    });
  }

  // Б) Освещение
  if (ghost.anxietyLevel === 'high' || ghost.specialRequirements.prefersDarkness) {
    if (place.lighting === 'very_low' || place.lighting === 'low') {
      score += 10;
      pros.push({
        category: 'lighting',
        type: 'pro',
        message: 'Глубокий сумрак/низкое освещение успокаивает тревожность',
        deltaScore: 10
      });
    } else if (place.lighting === 'medium') {
      score -= 10;
      warnings.push({
        category: 'lighting',
        type: 'warning',
        message: 'Средний уровень освещения может вызывать дискомфорт',
        deltaScore: -10
      });
    } else {
      score -= 25;
      warnings.push({
        category: 'lighting',
        type: 'warning',
        message: 'Слишком яркий свет усиливает беспокойство привидения',
        deltaScore: -25
      });
    }
  } else {
    if (place.lighting === 'high') {
      score -= 10;
      warnings.push({
        category: 'lighting',
        type: 'warning',
        message: 'Яркое освещение нетипично для привидений',
        deltaScore: -10
      });
    } else {
      score += 5;
      pros.push({
        category: 'lighting',
        type: 'pro',
        message: 'Комфортный уровень освещенности',
        deltaScore: 5
      });
    }
  }

  // В) Уровень шума
  if (ghost.specialRequirements.prefersSilence || ghost.anxietyLevel === 'high') {
    if (place.noiseLevel === 'silent') {
      score += 15;
      pros.push({
        category: 'noise',
        type: 'pro',
        message: 'Абсолютная тишина — идеальные условия для покоя',
        deltaScore: 15
      });
    } else if (place.noiseLevel === 'low') {
      score += 5;
      pros.push({
        category: 'noise',
        type: 'pro',
        message: 'Низкий уровень шума не нарушает покой',
        deltaScore: 5
      });
    } else if (place.noiseLevel === 'medium') {
      score -= 15;
      warnings.push({
        category: 'noise',
        type: 'warning',
        message: 'Умеренный фоновый шум может раздражать привидение',
        deltaScore: -15
      });
    } else {
      score -= 30;
      warnings.push({
        category: 'noise',
        type: 'warning',
        message: 'Высокий уровень постоянного шума не подходит',
        deltaScore: -30
      });
    }
  }

  // Г) Влажность
  if (ghost.specialRequirements.likesDampness) {
    if (place.humidity === 'high') {
      score += 10;
      pros.push({
        category: 'humidity',
        type: 'pro',
        message: 'Высокая сырость локации полностью соответствует предпочтению',
        deltaScore: 10
      });
    } else if (place.humidity === 'medium') {
      warnings.push({
        category: 'humidity',
        type: 'warning',
        message: 'Умеренная влажность, привидение предпочитает больше сырости',
        deltaScore: -5
      });
      score -= 5;
    } else {
      score -= 20;
      warnings.push({
        category: 'humidity',
        type: 'warning',
        message: 'Слишком сухой воздух для любителя сырости',
        deltaScore: -20
      });
    }
  }

  // Д) Люди (мягкое влияние, когда нет строгого запрета)
  if (!ghost.specialRequirements.isolatedFromHumans) {
    if (place.humanPresence === 'none') {
      score += 10;
      pros.push({
        category: 'humans',
        type: 'pro',
        message: 'Людей нет — гарантировано спокойное пребывание',
        deltaScore: 10
      });
    } else if (place.humanPresence === 'frequent' || place.humanPresence === 'constant') {
      score -= 15;
      warnings.push({
        category: 'humans',
        type: 'warning',
        message: 'Частые визиты людей могут создавать суету',
        deltaScore: -15
      });
    }
  }

  // Нормализация скора
  const finalScore = isEligible ? Math.max(0, Math.min(100, score)) : Math.max(0, Math.min(45, score - 50));

  // Формирование итогового резюме
  let summary = '';
  if (!isEligible) {
    summary = `Недопустимо (${hardConflicts.length} критических конфликта)`;
  } else if (finalScore >= 80) {
    summary = 'Отличная совместимость: большинство условий идеально совпадает';
  } else if (finalScore >= 60) {
    summary = 'Хорошая совместимость с незначительными компромиссами';
  } else {
    summary = 'Спорный вариант: присутствуют ощутимые нестыковки';
  }

  return {
    placeId: place.id,
    ghostId: ghost.id,
    score: finalScore,
    isEligible,
    pros,
    warnings,
    hardConflicts,
    summary
  };
}
