import { describe, it, expect } from 'vitest';
import { evaluatePlaceForGhost } from '../evaluator';
import { allocateGhostsToPlaces, calculateGhostPriority } from '../allocation';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';

describe('Ghost Relocation Scoring & Matching Engine', () => {
  const samplePlaceAttic: RelocationPlace = {
    id: 'place-attic',
    name: 'Башня с чердаком',
    type: 'Обсерватория',
    capacity: 2,
    lighting: 'low',
    noiseLevel: 'low',
    humidity: 'medium',
    humanPresence: 'rare',
    hasAttic: true,
    hasCellar: false,
    hasMirrors: false,
    description: 'Тестовая башня с чердаком'
  };

  const samplePlaceCastleMirrors: RelocationPlace = {
    id: 'place-castle',
    name: 'Замок с зеркалами',
    type: 'Замок',
    capacity: 5,
    lighting: 'low',
    noiseLevel: 'medium',
    humidity: 'medium',
    humanPresence: 'sometimes',
    hasAttic: true,
    hasCellar: true,
    hasMirrors: true,
    description: 'Тестовый замок'
  };

  const samplePlaceCellarDamp: RelocationPlace = {
    id: 'place-cellar',
    name: 'Глубокий склеп',
    type: 'Склеп',
    capacity: 1,
    lighting: 'very_low',
    noiseLevel: 'silent',
    humidity: 'high',
    humanPresence: 'none',
    hasAttic: false,
    hasCellar: true,
    hasMirrors: false,
    description: 'Тестовый склеп'
  };

  // TEST 1: Привидение получает место с максимальным допустимым score
  it('TEST 1: Ghost gets best eligible place with highest score', () => {
    const ghost: GhostApplication = {
      id: 'g1',
      name: 'Спокойный призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cold',
      deadlineHoursLeft: 100,
      specialRequirements: {
        likesDampness: true,
        prefersSilence: true
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    const evalAttic = evaluatePlaceForGhost(ghost, samplePlaceAttic);
    const evalCellar = evaluatePlaceForGhost(ghost, samplePlaceCellarDamp);

    expect(evalCellar.isEligible).toBe(true);
    expect(evalAttic.isEligible).toBe(true);
    expect(evalCellar.score).toBeGreaterThan(evalAttic.score);
    expect(evalCellar.pros.some(p => p.category === 'noise')).toBe(true);
    expect(evalCellar.pros.some(p => p.category === 'humidity')).toBe(true);
  });

  // TEST 2: Место с hard constraint не может быть автоматически назначено
  it('TEST 2: Hard constraint violation renders place ineligible', () => {
    const ghostMirrorPhobia: GhostApplication = {
      id: 'g2',
      name: 'Агата Тест',
      anxietyLevel: 'high',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: {
        noMirrors: true,
        requiresAttic: true
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    const evaluation = evaluatePlaceForGhost(ghostMirrorPhobia, samplePlaceCastleMirrors);
    expect(evaluation.isEligible).toBe(false);
    expect(evaluation.hardConflicts.length).toBeGreaterThan(0);
    expect(evaluation.hardConflicts[0].message).toContain('фобия зеркал');
  });

  // TEST 3: Заполненное место не может быть назначено при нехватке вместимости
  it('TEST 3: Fully occupied place cannot be auto-assigned', () => {
    const ghostA: GhostApplication = {
      id: 'gA',
      name: 'Срочный призрак',
      anxietyLevel: 'high',
      preferredTemperature: 'cold',
      deadlineHoursLeft: 2, // Срочно
      specialRequirements: {
        isolatedFromHumans: true
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    const ghostB: GhostApplication = {
      id: 'gB',
      name: 'Несрочный призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cold',
      deadlineHoursLeft: 120, // 5 дней
      specialRequirements: {
        isolatedFromHumans: true
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    // samplePlaceCellarDamp has capacity: 1
    const result = allocateGhostsToPlaces([ghostA, ghostB], [samplePlaceCellarDamp]);

    // Ghost A has priority -> gets the single slot
    expect(result.ghostResults['gA'].recommendedPlaceId).toBe('place-cellar');
    expect(result.placeOccupants['place-cellar']).toContain('gA');

    // Ghost B cannot fit -> status 'impossible' due to capacity
    expect(result.ghostResults['gB'].recommendedPlaceId).toBeNull();
    expect(result.ghostResults['gB'].status).toBe('impossible');
    expect(result.ghostResults['gB'].impossibleReasons?.[0]).toContain('заполнены');
  });

  // TEST 4: Deadline НЕ является hard constraint
  it('TEST 4: Expired deadline is relocatable if physical place matches', () => {
    const expiredGhost: GhostApplication = {
      id: 'g-overdue',
      name: 'Луиза Тест',
      anxietyLevel: 'high',
      preferredTemperature: 'cold',
      deadlineHoursLeft: -10, // Просрочено!
      specialRequirements: {
        isolatedFromHumans: true
      },
      status: 'needs_attention',
      assignedPlaceId: null,
      manualOverride: false
    };

    const evaluation = evaluatePlaceForGhost(expiredGhost, samplePlaceCellarDamp);
    expect(evaluation.isEligible).toBe(true);
    expect(evaluation.hardConflicts.length).toBe(0);

    const allocation = allocateGhostsToPlaces([expiredGhost], [samplePlaceCellarDamp]);
    expect(allocation.ghostResults['g-overdue'].recommendedPlaceId).toBe('place-cellar');
  });

  // TEST 5: Приоритет в очереди конкуренции
  it('TEST 5: Priority calculation respects overdue and urgent deadlines', () => {
    const overdueGhost: GhostApplication = {
      id: 'g1',
      name: 'Overdue',
      anxietyLevel: 'medium',
      preferredTemperature: 'cool',
      deadlineHoursLeft: -5,
      specialRequirements: {},
      status: 'needs_attention',
      assignedPlaceId: null,
      manualOverride: false
    };

    const urgentGhost: GhostApplication = {
      id: 'g2',
      name: 'Urgent',
      anxietyLevel: 'medium',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 10,
      specialRequirements: {},
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    const relaxedGhost: GhostApplication = {
      id: 'g3',
      name: 'Relaxed',
      anxietyLevel: 'medium',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 100,
      specialRequirements: {},
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    expect(calculateGhostPriority(overdueGhost)).toBeGreaterThan(calculateGhostPriority(urgentGhost));
    expect(calculateGhostPriority(urgentGhost)).toBeGreaterThan(calculateGhostPriority(relaxedGhost));
  });

  // TEST 6: Ручной выбор конфликтующего места выявляет конфликты для предупреждения
  it('TEST 6: Manual choice of conflicting place flags hard conflicts for warning dialog', () => {
    const ghostWithHumansPhobia: GhostApplication = {
      id: 'g4',
      name: 'Морок Тест',
      anxietyLevel: 'high',
      preferredTemperature: 'cold',
      deadlineHoursLeft: 50,
      specialRequirements: {
        isolatedFromHumans: true
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    // samplePlaceCastleMirrors has humanPresence: 'sometimes'
    const evalResult = evaluatePlaceForGhost(ghostWithHumansPhobia, samplePlaceCastleMirrors);
    expect(evalResult.isEligible).toBe(false);
    expect(evalResult.hardConflicts.length).toBeGreaterThan(0);
    expect(evalResult.hardConflicts.some(c => c.category === 'humans')).toBe(true);
  });

  // TEST 7: Точные тесты на бонусы (noise, humidity, lighting, human absence)
  it('TEST 7: Exact scoring bonuses (noise, humidity, lighting, human absence) are added to score', () => {
    // Base ghost with preferences that activate bonuses
    const ghost: GhostApplication = {
      id: 'g-bonus',
      name: 'Бонусный призрак',
      anxietyLevel: 'high',
      preferredTemperature: 'cold',
      deadlineHoursLeft: 48,
      specialRequirements: {
        prefersSilence: true,
        likesDampness: true,
        prefersDarkness: true,
        isolatedFromHumans: false
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    // Baseline place: tempDiff = 2 (-25), medium light (-10), medium noise (-15), dry/low humidity (-20), rare humans (0)
    // Base score = 100 - 25 - 10 - 15 - 20 = 30
    const baselinePlace: RelocationPlace = {
      id: 'p-base',
      name: 'Базовая локация',
      type: 'Библиотека',
      capacity: 5,
      lighting: 'medium',
      noiseLevel: 'medium',
      humidity: 'low',
      humanPresence: 'rare',
      hasAttic: false,
      hasCellar: false,
      hasMirrors: false,
      description: 'База'
    };

    const baseEval = evaluatePlaceForGhost(ghost, baselinePlace);
    expect(baseEval.score).toBe(30);

    // 1. Noise bonus: silent -> deltaScore = +15 (swings from -15 to +15: +30)
    const silentPlace = { ...baselinePlace, noiseLevel: 'silent' as const };
    const silentEval = evaluatePlaceForGhost(ghost, silentPlace);
    const noisePro = silentEval.pros.find(p => p.category === 'noise');
    expect(noisePro).toBeDefined();
    expect(noisePro?.deltaScore).toBe(15);
    expect(silentEval.score).toBe(baseEval.score + 15 - (-15)); // 60

    // 2. Humidity bonus: high -> deltaScore = +10 (swings from -20 to +10: +30)
    const dampPlace = { ...baselinePlace, humidity: 'high' as const };
    const dampEval = evaluatePlaceForGhost(ghost, dampPlace);
    const humidityPro = dampEval.pros.find(p => p.category === 'humidity');
    expect(humidityPro).toBeDefined();
    expect(humidityPro?.deltaScore).toBe(10);
    expect(dampEval.score).toBe(baseEval.score + 10 - (-20)); // 60

    // 3. Lighting bonus: very_low -> deltaScore = +10 (swings from -10 to +10: +20)
    const darkPlace = { ...baselinePlace, lighting: 'very_low' as const };
    const darkEval = evaluatePlaceForGhost(ghost, darkPlace);
    const lightingPro = darkEval.pros.find(p => p.category === 'lighting');
    expect(lightingPro).toBeDefined();
    expect(lightingPro?.deltaScore).toBe(10);
    expect(darkEval.score).toBe(baseEval.score + 10 - (-10)); // 50

    // 4. Human absence bonus: none -> deltaScore = +10 (swings from 0 to +10: +10)
    const emptyPlace = { ...baselinePlace, humanPresence: 'none' as const };
    const emptyEval = evaluatePlaceForGhost(ghost, emptyPlace);
    const humansPro = emptyEval.pros.find(p => p.category === 'humans');
    expect(humansPro).toBeDefined();
    expect(humansPro?.deltaScore).toBe(10);
    expect(emptyEval.score).toBe(baseEval.score + 10); // 40
  });
});
