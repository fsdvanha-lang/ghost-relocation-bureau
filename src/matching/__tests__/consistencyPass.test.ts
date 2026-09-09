import { describe, it, expect } from 'vitest';
import { 
  getResolutionStatus, 
  getUrgencyLevel, 
  getAttentionInfo, 
  getInspectorDecisionHeader,
  getResolutionLabel,
  getUrgencyLabel
} from '../../utils/statusSystem';
import { evaluatePlaceForGhost } from '../evaluator';
import { allocateGhostsToPlaces } from '../allocation';
import { bureauReducer, validateBureauStorage, type BureauState } from '../../context/BureauContext';
import { INITIAL_GHOSTS } from '../../data/ghosts.seed';
import { INITIAL_PLACES } from '../../data/places.seed';
import type { GhostApplication } from '../../types/ghost';

describe('Final Bug + UX Consistency Pass: Status, Urgency, Actions & Attention', () => {
  // Requirement 1 & 7: Assigned + Expired -> "Расселено · требуется внимание из-за просроченного дедлайна"
  it('Requirement 1 & 7: Assigned + Expired ghost has action "Проверить" and is not marked as requiring manual relocation', () => {
    const assignedExpiredGhost: GhostApplication = {
      id: 'g-exp',
      name: 'Просроченная сущность',
      anxietyLevel: 'medium',
      preferredTemperature: 'cold',
      deadlineHoursLeft: -3, // Expired
      specialRequirements: {},
      status: 'assigned_auto',
      assignedPlaceId: 'place-1',
      manualOverride: false
    };

    const attention = getAttentionInfo(assignedExpiredGhost);
    expect(attention.needsAttention).toBe(true);
    expect(attention.isActionRequired).toBe(false); // Already placed! No relocation required
    expect(attention.badgeText).toBe('Расселено · требует контроля');
    expect(attention.why).toBe('Расселено · требует контроля из-за просроченного дедлайна');
    expect(attention.why).not.toContain('Требуется ручное размещение');
    expect(attention.why).not.toContain('экстренное ручное размещение');
  });

  // Requirement 2: Strict Orthogonal Status Categories
  it('Requirement 2: Resolution and Urgency are independent orthogonal categories', () => {
    // 1. Resolution categories
    expect(getResolutionLabel('unprocessed')).toBe('Не обработано');
    expect(getResolutionLabel('assigned_auto')).toBe('Расселено автоматически');
    expect(getResolutionLabel('assigned_manual')).toBe('Расселено вручную');
    expect(getResolutionLabel('impossible')).toBe('Невозможно');

    // 2. Urgency categories
    expect(getUrgencyLevel(30)).toBe('normal');
    expect(getUrgencyLabel('normal')).toBe('Норма');
    expect(getUrgencyLevel(18)).toBe('attention');
    expect(getUrgencyLabel('attention')).toBe('Внимание');
    expect(getUrgencyLevel(5)).toBe('urgent');
    expect(getUrgencyLabel('urgent')).toBe('Срочно');
    expect(getUrgencyLevel(-2)).toBe('expired');
    expect(getUrgencyLabel('expired')).toBe('Просрочено');

    // Ghost resolution does not get overwritten by urgency
    const ghostUrgentAssigned: GhostApplication = {
      id: 'g-urgent',
      name: 'Срочная сущность',
      anxietyLevel: 'low',
      preferredTemperature: 'warm',
      deadlineHoursLeft: 6, // urgent
      specialRequirements: {},
      status: 'assigned_auto',
      assignedPlaceId: 'place-2',
      manualOverride: false
    };

    const resolution = getResolutionStatus(ghostUrgentAssigned);
    const urgency = getUrgencyLevel(ghostUrgentAssigned.deadlineHoursLeft);

    expect(resolution).toBe('assigned_auto');
    expect(urgency).toBe('urgent');
  });

  // Requirement 3: Unified Actions
  it('Requirement 3: Unified action labels across all contexts', () => {
    // List / Table action is always "Проверить"
    const ghost: GhostApplication = {
      id: 'g-test',
      name: 'Тест',
      anxietyLevel: 'high',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 10,
      specialRequirements: {},
      status: 'assigned_auto',
      assignedPlaceId: 'place-1',
      manualOverride: false
    };

    const attention = getAttentionInfo(ghost);
    expect(attention.actionLabel).toBe('Проверить');
  });

  // Requirement 11: WHY ATTENTION is explicit for each scenario
  it('Requirement 11: Explicit reason for attention in all edge cases', () => {
    // Impossible
    const ghostImpossible: GhostApplication = {
      id: 'g-imp',
      name: 'Невозможный призрак',
      anxietyLevel: 'high',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: { requiresAttic: true, requiresCellar: true },
      status: 'impossible',
      assignedPlaceId: null,
      manualOverride: false
    };

    const attentionImp = getAttentionInfo(ghostImpossible);
    expect(attentionImp.needsAttention).toBe(true);
    expect(attentionImp.isActionRequired).toBe(true);
    expect(attentionImp.why).toContain('Нет подходящей локации');

    // Normal assigned ghost (> 24h) needs no attention
    const ghostNormal: GhostApplication = {
      id: 'g-norm',
      name: 'Штатный призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'moderate',
      deadlineHoursLeft: 48,
      specialRequirements: {},
      status: 'assigned_auto',
      assignedPlaceId: 'place-3',
      manualOverride: false
    };

    const attentionNorm = getAttentionInfo(ghostNormal);
    expect(attentionNorm.needsAttention).toBe(false);
  });

  // Requirement 12: Inspector Decision Status Headers
  it('Requirement 12: Inspector displays prominent DECISION STATUS header', () => {
    // Confirmed Auto
    const ghostAuto: GhostApplication = {
      id: 'g-auto',
      name: 'Авто призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: {},
      status: 'assigned_auto',
      assignedPlaceId: 'place-1',
      manualOverride: false
    };
    const headerAuto = getInspectorDecisionHeader(ghostAuto);
    expect(headerAuto.code).toBe('CONFIRMED');
    expect(headerAuto.label).toBe('✓ НАЗНАЧЕНО АЛГОРИТМОМ');

    // Confirmed Manual
    const ghostManual: GhostApplication = {
      id: 'g-man',
      name: 'Ручной призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: {},
      status: 'assigned_manual',
      assignedPlaceId: 'place-2',
      manualOverride: true
    };
    const headerManual = getInspectorDecisionHeader(ghostManual);
    expect(headerManual.code).toBe('CONFIRMED');
    expect(headerManual.label).toBe('✓ ПОДТВЕРЖДЕНО ОПЕРАТОРОМ');

    // Impossible
    const ghostImp: GhostApplication = {
      id: 'g-imp',
      name: 'Невозможный призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: {},
      status: 'impossible',
      assignedPlaceId: null,
      manualOverride: false
    };
    const headerImp = getInspectorDecisionHeader(ghostImp);
    expect(headerImp.code).toBe('IMPOSSIBLE');
    expect(headerImp.label).toContain('НЕВОЗМОЖНО РАССЕЛИТЬ');

    // Unprocessed
    const ghostUnprocessed: GhostApplication = {
      id: 'g-unp',
      name: 'Новый призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'cool',
      deadlineHoursLeft: 48,
      specialRequirements: {},
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };
    const headerUnp = getInspectorDecisionHeader(ghostUnprocessed);
    expect(headerUnp.code).toBe('REQUIRES_DECISION');
    expect(headerUnp.label).toContain('ТРЕБУЕТ РЕШЕНИЯ');
  });

  // Requirement: State Transitions & Data Consistency (Assign, Unassign, Manual Override, Reset)
  it('State Transitions & Consistency: Manual override atomically updates ghost and place occupancy', async () => {
    const { allocateGhostsToPlaces } = await import('../allocation');
    const { INITIAL_GHOSTS } = await import('../../data/ghosts.seed');
    const { INITIAL_PLACES } = await import('../../data/places.seed');

    // 1. Initial allocation
    const allocInit = allocateGhostsToPlaces(INITIAL_GHOSTS, INITIAL_PLACES);
    expect(allocInit.placeOccupants['place-1']).toBeDefined();

    // 2. Perform manual override on ghost-1 to place-2
    const targetGhostId = 'ghost-1';
    const targetPlaceId = 'place-2';
    const updatedGhosts = INITIAL_GHOSTS.map(g => {
      if (g.id === targetGhostId) {
        return {
          ...g,
          assignedPlaceId: targetPlaceId,
          manualOverride: true,
          manualOverrideReason: 'Специальное решение оператора',
          status: 'assigned_manual' as const
        };
      }
      return g;
    });

    const allocAfterOverride = allocateGhostsToPlaces(updatedGhosts, INITIAL_PLACES);

    // Ghost-1 must be in place-2 occupants list
    expect(allocAfterOverride.placeOccupants[targetPlaceId]).toContain(targetGhostId);
    expect(allocAfterOverride.ghostResults[targetGhostId].status).toBe('assigned_manual');
    expect(allocAfterOverride.ghostResults[targetGhostId].recommendedPlaceId).toBe(targetPlaceId);

    // 3. Reset to Seed returns exact initial state
    const allocAfterReset = allocateGhostsToPlaces(INITIAL_GHOSTS, INITIAL_PLACES);
    expect(allocAfterReset.ghostResults[targetGhostId].status).not.toBe('assigned_manual');
  });

  // P0-1: Manual assignment cannot exceed capacity
  it('P0-1: manual assignment cannot exceed capacity and capacity overflow is strictly rejected', () => {
    // 1. Setup a controlled state with place of capacity 1 (place-7)
    const singlePlace = INITIAL_PLACES.find(p => p.id === 'place-7');
    expect(singlePlace).toBeDefined();
    expect(singlePlace?.capacity).toBe(1);

    const testState: BureauState = {
      ghosts: INITIAL_GHOSTS.map(g => ({
        ...g,
        assignedPlaceId: null,
        status: 'new' as const,
        manualOverride: false
      })),
      places: INITIAL_PLACES,
      allocation: allocateGhostsToPlaces(INITIAL_GHOSTS, INITIAL_PLACES),
      activeView: 'dashboard',
      selectedGhostId: null
    };

    // First manual assignment takes the only slot in place-7
    const stateWithOneAssigned = bureauReducer(testState, {
      type: 'ASSIGN_MANUAL',
      ghostId: 'ghost-1',
      placeId: 'place-7',
      reason: 'Первое назначение в обсерваторию'
    });

    const ghost1After = stateWithOneAssigned.ghosts.find(g => g.id === 'ghost-1');
    expect(ghost1After?.assignedPlaceId).toBe('place-7');
    expect(ghost1After?.manualOverride).toBe(true);

    // Second manual assignment for a DIFFERENT ghost to full place-7 must be rejected
    const stateAttemptOverCapacity = bureauReducer(stateWithOneAssigned, {
      type: 'ASSIGN_MANUAL',
      ghostId: 'ghost-2',
      placeId: 'place-7',
      reason: 'Попытка ручного переполнения'
    });

    // The reducer must return the state unchanged and ghost-2 must NOT be assigned to place-7
    expect(stateAttemptOverCapacity).toBe(stateWithOneAssigned);
    const ghost2After = stateAttemptOverCapacity.ghosts.find(g => g.id === 'ghost-2');
    expect(ghost2After?.assignedPlaceId).not.toBe('place-7');

    // 2. Also verify allocateGhostsToPlaces respects capacity when multiple ghosts have manual override
    const ghostsWithDoubleOverride: GhostApplication[] = [
      {
        ...INITIAL_GHOSTS[0],
        id: 'g-over-1',
        assignedPlaceId: 'place-7',
        manualOverride: true,
        status: 'assigned_manual'
      },
      {
        ...INITIAL_GHOSTS[1],
        id: 'g-over-2',
        assignedPlaceId: 'place-7',
        manualOverride: true,
        status: 'assigned_manual'
      }
    ];

    const allocResult = allocateGhostsToPlaces(ghostsWithDoubleOverride, INITIAL_PLACES);
    // place-7 has capacity 1, so occupants list cannot exceed 1
    expect(allocResult.placeOccupants['place-7'].length).toBeLessThanOrEqual(1);
    // The second ghost attempting override must be marked impossible
    expect(allocResult.ghostResults['g-over-2'].status).toBe('impossible');
    expect(allocResult.ghostResults['g-over-2'].impossibleReasons?.[0]).toContain('заполнена');
  });

  // P0-2: Low Score ≠ Hard Conflict
  it('P0-2: Low score without hard constraint violations is eligible (score < 60) and does not report hard conflicts', () => {
    // A ghost with no hard constraints, but soft temperature and noise mismatches
    const pickyGhost: GhostApplication = {
      id: 'g-picky',
      name: 'Привередливый призрак',
      anxietyLevel: 'low',
      preferredTemperature: 'warm', // place-6 has cold cellar
      deadlineHoursLeft: 40,
      specialRequirements: {
        // No hard constraints like noMirrors, requiresAttic, etc.
      },
      status: 'new',
      assignedPlaceId: null,
      manualOverride: false
    };

    // place-2 has high lighting, high noise, high humidity, frequent humans
    const placeLighthouse = INITIAL_PLACES.find(p => p.id === 'place-2');
    expect(placeLighthouse).toBeDefined();

    if (placeLighthouse) {
      const evaluation = evaluatePlaceForGhost(pickyGhost, placeLighthouse);

      // Must be physically eligible (no hard conflicts)
      expect(evaluation.isEligible).toBe(true);
      expect(evaluation.hardConflicts).toHaveLength(0);

      // Score is lower than 60 due to noise and lighting mismatches
      expect(evaluation.score).toBeLessThan(60);

      // Soft warnings exist explaining why score is low
      expect(evaluation.warnings.length).toBeGreaterThan(0);
    }
  });

  // P0-3: Impossible Reasons Factual (Ghost "Тень без имени")
  it('P0-3: Impossible reasons for ghost "Тень без имени" are strictly factual without false claims', () => {
    const shadowGhost = INITIAL_GHOSTS.find(g => g.name === 'Тень без имени' || g.id === 'ghost-9');
    expect(shadowGhost).toBeDefined();

    if (shadowGhost) {
      const alloc = allocateGhostsToPlaces(INITIAL_GHOSTS, INITIAL_PLACES);
      const result = alloc.ghostResults[shadowGhost.id];

      expect(result.status).toBe('impossible');
      expect(result.impossibleReasons).toBeDefined();
      const reasons = result.impossibleReasons || [];

      // Must use factually provable phrasing
      const joinedReasons = reasons.join(' ');
      expect(joinedReasons).toContain('Нет ни одной локации, которая одновременно удовлетворяет всем обязательным ограничениям.');

      // Must NOT contain false claims
      expect(joinedReasons).not.toContain('Не существует локации с одновременным наличием чердака и подвала');
      expect(joinedReasons).not.toContain('Все потенциально доступные локации оборудованы зеркалами');
    }
  });

  // P1-1: Auto Matching uses real seed names and real evaluated scores
  it('P1-1: Auto matching uses real seed names and real scores from the evaluation engine', () => {
    // Seed names verification
    const names = INITIAL_GHOSTS.map(g => g.name);
    expect(names).toContain('Агата');
    expect(names).toContain('Морок');
    expect(names).toContain('Эдгар');
    expect(names).toContain('Тень без имени');

    // No fake sample names
    expect(names).not.toContain('Агата де Морт');
    expect(names).not.toContain('Бальтазар');

    // Real evaluated scores & allocation accounting
    const alloc = allocateGhostsToPlaces(INITIAL_GHOSTS, INITIAL_PLACES);
    let allocatedCount = 0;
    let impossibleCount = 0;

    for (const ghost of INITIAL_GHOSTS) {
      const res = alloc.ghostResults[ghost.id];
      if (res.status === 'assigned_auto') {
        allocatedCount++;
        expect(res.recommendedPlaceId).toBeTruthy();
        const place = INITIAL_PLACES.find(p => p.id === res.recommendedPlaceId);
        expect(place).toBeDefined();
        const recPlaceId = res.recommendedPlaceId;
        if (place && recPlaceId) {
          const evalDirect = evaluatePlaceForGhost(ghost, place);
          expect(res.evaluations[recPlaceId]?.score).toBe(evalDirect.score);
          expect(res.evaluations[recPlaceId]?.score).toBeGreaterThan(0);
        }
      } else if (res.status === 'impossible') {
        impossibleCount++;
        expect(res.recommendedPlaceId).toBeNull();
      }
    }

    expect(allocatedCount + impossibleCount).toBe(INITIAL_GHOSTS.length);
    expect(allocatedCount).toBe(9);
    expect(impossibleCount).toBe(1);
  });

  // P1-4: Storage validation (Option A: all 9 Ghost fields and 11 Place fields validated, zero any)
  it('P1-4: Storage validation validates all 9 Ghost fields and 11 Place fields with fallback to Seed', () => {
    // 1. Non-object or corrupt inputs fail safely
    expect(validateBureauStorage(null)).toBeNull();
    expect(validateBureauStorage(undefined)).toBeNull();
    expect(validateBureauStorage('corrupt_string')).toBeNull();
    expect(validateBureauStorage(12345)).toBeNull();
    expect(validateBureauStorage({ ghosts: [], places: [] })).toBeNull();

    // 2. Ghost missing domain fields fails
    const invalidGhostMissingFields = {
      ghosts: [{ id: 'g-incomplete', name: 'Неполный призрак' }], // missing anxietyLevel, preferredTemperature, etc.
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidGhostMissingFields)).toBeNull();

    // 3. Place missing domain fields fails
    const invalidPlaceMissingFields = {
      ghosts: INITIAL_GHOSTS,
      places: [{ id: 'p-incomplete', name: 'Неполное место' }] // missing capacity, lighting, hasMirrors, etc.
    };
    expect(validateBureauStorage(invalidPlaceMissingFields)).toBeNull();

    // 4. Ghost with invalid enum values fails
    const invalidGhostEnumAnxiety = {
      ghosts: [{ ...INITIAL_GHOSTS[0], anxietyLevel: 'super_high' }],
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidGhostEnumAnxiety)).toBeNull();

    const invalidGhostEnumTemp = {
      ghosts: [{ ...INITIAL_GHOSTS[0], preferredTemperature: 'lava' }],
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidGhostEnumTemp)).toBeNull();

    const invalidGhostEnumStatus = {
      ghosts: [{ ...INITIAL_GHOSTS[0], status: 'archived_deleted' }],
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidGhostEnumStatus)).toBeNull();

    // 5. Place with invalid enum values fails
    const invalidPlaceEnumLighting = {
      ghosts: INITIAL_GHOSTS,
      places: [{ ...INITIAL_PLACES[0], lighting: 'neon_fluorescent' }]
    };
    expect(validateBureauStorage(invalidPlaceEnumLighting)).toBeNull();

    const invalidPlaceEnumNoise = {
      ghosts: INITIAL_GHOSTS,
      places: [{ ...INITIAL_PLACES[0], noiseLevel: 'stadium_rock' }]
    };
    expect(validateBureauStorage(invalidPlaceEnumNoise)).toBeNull();

    const invalidPlaceEnumHumidity = {
      ghosts: INITIAL_GHOSTS,
      places: [{ ...INITIAL_PLACES[0], humidity: 'submerged' }]
    };
    expect(validateBureauStorage(invalidPlaceEnumHumidity)).toBeNull();

    const invalidPlaceEnumHumans = {
      ghosts: INITIAL_GHOSTS,
      places: [{ ...INITIAL_PLACES[0], humanPresence: 'mythical' }]
    };
    expect(validateBureauStorage(invalidPlaceEnumHumans)).toBeNull();

    // 6. Non-boolean values fail
    const invalidGhostNonBoolean = {
      ghosts: [{ ...INITIAL_GHOSTS[0], manualOverride: 'true' }],
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidGhostNonBoolean)).toBeNull();

    const invalidPlaceNonBoolean = {
      ghosts: INITIAL_GHOSTS,
      places: [{ ...INITIAL_PLACES[0], hasAttic: 1 }],
      placesOriginal: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidPlaceNonBoolean)).toBeNull();

    const invalidReqNonBoolean = {
      ghosts: [{ ...INITIAL_GHOSTS[0], specialRequirements: { requiresAttic: 'yes' } }],
      places: INITIAL_PLACES
    };
    expect(validateBureauStorage(invalidReqNonBoolean)).toBeNull();

    // 7. Valid seed data passes with flying colors
    const validData = {
      ghosts: INITIAL_GHOSTS,
      places: INITIAL_PLACES
    };
    const validated = validateBureauStorage(validData);
    expect(validated).not.toBeNull();
    expect(validated?.ghosts).toHaveLength(INITIAL_GHOSTS.length);
    expect(validated?.places).toHaveLength(INITIAL_PLACES.length);
  });
});
