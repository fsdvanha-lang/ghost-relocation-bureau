import React, { createContext, useContext, useReducer, useEffect, useMemo, useState, useCallback } from 'react';
import type { GhostApplication } from '../types/ghost';
import type { RelocationPlace } from '../types/place';
import { INITIAL_GHOSTS } from '../data/ghosts.seed';
import { INITIAL_PLACES } from '../data/places.seed';
import { allocateGhostsToPlaces } from '../matching/allocation';
import type { AllocationState } from '../matching/allocation';

export interface BureauStats {
  totalGhosts: number;
  relocatedCount: number;
  relocatedAutoCount: number;
  relocatedManualCount: number;
  unassignedCount: number;
  impossibleCount: number;
  needsAttentionCount: number;
  totalCapacity: number;
  totalOccupied: number;
  availableSlots: number;
  occupancyPercent: number;
  averageScore: number;
}

export interface BureauState {
  ghosts: GhostApplication[];
  places: RelocationPlace[];
  allocation: AllocationState;
  activeView: 'dashboard' | 'applications' | 'places' | 'decisions' | 'worklog';
  selectedGhostId: string | null;
}

export type BureauAction =
  | { type: 'SET_VIEW'; view: BureauState['activeView'] }
  | { type: 'SELECT_GHOST'; ghostId: string | null }
  | { type: 'ASSIGN_MANUAL'; ghostId: string; placeId: string; reason?: string }
  | { type: 'UNASSIGN_GHOST'; ghostId: string }
  | { type: 'RUN_AUTO_ALLOCATION' }
  | { type: 'RESET_TO_SEED' };

export const STORAGE_KEY = 'mox_ghost_bureau_state_v2';

export function computeInitialAllocation(ghosts: GhostApplication[], places: RelocationPlace[]): AllocationState {
  return allocateGhostsToPlaces(ghosts, places);
}

export function bureauReducer(state: BureauState, action: BureauAction): BureauState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view, selectedGhostId: null };

    case 'SELECT_GHOST':
      return { ...state, selectedGhostId: action.ghostId };

    case 'ASSIGN_MANUAL': {
      const targetPlace = state.places.find(p => p.id === action.placeId);
      if (!targetPlace) return state;

      // P0-1: manual assignment cannot exceed capacity
      const currentOccupants = state.ghosts.filter(
        g => g.id !== action.ghostId && g.assignedPlaceId === action.placeId
      );
      if (currentOccupants.length >= targetPlace.capacity) {
        return state; // Capacity overflow strictly forbidden
      }

      const updatedGhosts = state.ghosts.map(g => {
        if (g.id === action.ghostId) {
          return {
            ...g,
            assignedPlaceId: action.placeId,
            manualOverride: true,
            manualOverrideReason: action.reason || 'Ручное решение оператора',
            status: 'assigned_manual' as const
          };
        }
        return g;
      });

      const newAllocation = allocateGhostsToPlaces(updatedGhosts, state.places);
      return {
        ...state,
        ghosts: updatedGhosts,
        allocation: newAllocation
      };
    }

    case 'UNASSIGN_GHOST': {
      const updatedGhosts = state.ghosts.map(g => {
        if (g.id === action.ghostId) {
          return {
            ...g,
            assignedPlaceId: null,
            manualOverride: false,
            manualOverrideReason: undefined,
            status: 'new' as const
          };
        }
        return g;
      });

      const newAllocation = allocateGhostsToPlaces(updatedGhosts, state.places);
      return {
        ...state,
        ghosts: updatedGhosts,
        allocation: newAllocation
      };
    }

    case 'RUN_AUTO_ALLOCATION': {
      // Сохраняем ручные назначения, остальные сбрасываем в авто-распределение
      const resetForAuto = state.ghosts.map(g => {
        if (g.manualOverride) return g;
        return {
          ...g,
          assignedPlaceId: null,
          status: 'new' as const
        };
      });

      const newAllocation = allocateGhostsToPlaces(resetForAuto, state.places);

      // Применяем рекомендации к заявкам
      const finalizedGhosts = resetForAuto.map(g => {
        if (g.manualOverride) return g;
        const res = newAllocation.ghostResults[g.id];
        return {
          ...g,
          assignedPlaceId: res?.recommendedPlaceId || null,
          status: res?.status || 'impossible'
        };
      });

      return {
        ...state,
        ghosts: finalizedGhosts,
        allocation: newAllocation
      };
    }

    case 'RESET_TO_SEED': {
      const initialGhosts = INITIAL_GHOSTS;
      const initialPlaces = INITIAL_PLACES;
      const newAllocation = allocateGhostsToPlaces(initialGhosts, initialPlaces);
      return {
        ghosts: initialGhosts,
        places: initialPlaces,
        allocation: newAllocation,
        activeView: state.activeView,
        selectedGhostId: null
      };
    }

    default:
      return state;
  }
}

export interface BureauContextValue {
  state: BureauState;
  dispatch: React.Dispatch<BureauAction>;
  stats: BureauStats;
  selectedGhost: GhostApplication | null;
  setView: (view: BureauState['activeView']) => void;
  selectGhost: (ghostId: string | null) => void;
  assignManual: (ghostId: string, placeId: string, reason?: string) => void;
  unassignGhost: (ghostId: string) => void;
  runAutoAllocation: () => Promise<void>;
  closeAllocationModal: () => void;
  resetToSeed: () => void;
  isAllocating: boolean;
  allocationStep: string | null;
  allocationStageNumber: number;
  recentlyUpdatedGhostIds: string[];
  lastSyncTime: string;
}

const VALID_GHOST_ANXIETY = new Set<string>(['low', 'medium', 'high']);
const VALID_GHOST_TEMPERATURE = new Set<string>(['freezing', 'cold', 'cool', 'moderate', 'warm']);
const VALID_GHOST_STATUS = new Set<string>([
  'new',
  'matched',
  'assigned_auto',
  'assigned_manual',
  'needs_attention',
  'impossible'
]);

const VALID_PLACE_LIGHTING = new Set<string>(['very_low', 'low', 'medium', 'high']);
const VALID_PLACE_NOISE = new Set<string>(['silent', 'low', 'medium', 'high']);
const VALID_PLACE_HUMIDITY = new Set<string>(['low', 'medium', 'high']);
const VALID_PLACE_HUMAN_PRESENCE = new Set<string>(['none', 'rare', 'sometimes', 'frequent', 'constant']);

const SPECIAL_REQUIREMENT_BOOLEAN_KEYS = [
  'isolatedFromHumans',
  'requiresAttic',
  'requiresCellar',
  'noMirrors',
  'prefersSilence',
  'likesDampness',
  'prefersDarkness'
];

/**
 * P1-4: Строгая runtime-валидация сохраняемого состояния Bureau
 * Проверяет не только typeof полей, но и допустимые enum/union значения.
 * Проверяет, что все boolean-поля действительно boolean.
 * При наличии невалидных, неизвестных или поврежденных данных возвращает null для безопасного отката к Seed.
 */
export function validateBureauStorage(raw: unknown): { ghosts: GhostApplication[]; places: RelocationPlace[] } | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Record<string, unknown>;

  if (!Array.isArray(candidate.ghosts) || !Array.isArray(candidate.places)) {
    return null;
  }
  if (candidate.ghosts.length === 0 || candidate.places.length === 0) {
    return null;
  }

  const isGhostsValid = candidate.ghosts.every(item => {
    if (!item || typeof item !== 'object') return false;
    const g = item as Record<string, unknown>;

    // 1. Примитивные и структурные проверки типов
    if (
      typeof g.id !== 'string' ||
      typeof g.name !== 'string' ||
      typeof g.anxietyLevel !== 'string' ||
      typeof g.preferredTemperature !== 'string' ||
      typeof g.deadlineHoursLeft !== 'number' ||
      !g.specialRequirements ||
      typeof g.specialRequirements !== 'object' ||
      typeof g.status !== 'string' ||
      (g.assignedPlaceId !== null && typeof g.assignedPlaceId !== 'string') ||
      typeof g.manualOverride !== 'boolean' ||
      (g.manualOverrideReason !== undefined && typeof g.manualOverrideReason !== 'string') ||
      (g.bio !== undefined && typeof g.bio !== 'string')
    ) {
      return false;
    }

    // 2. Проверка допустимых значений enum/union
    if (
      !VALID_GHOST_ANXIETY.has(g.anxietyLevel) ||
      !VALID_GHOST_TEMPERATURE.has(g.preferredTemperature) ||
      !VALID_GHOST_STATUS.has(g.status)
    ) {
      return false;
    }

    // 3. Строгая валидация boolean-полей требований
    const req = g.specialRequirements as Record<string, unknown>;
    for (const key of SPECIAL_REQUIREMENT_BOOLEAN_KEYS) {
      if (key in req && typeof req[key] !== 'boolean') {
        return false;
      }
    }

    return true;
  });

  const isPlacesValid = candidate.places.every(item => {
    if (!item || typeof item !== 'object') return false;
    const p = item as Record<string, unknown>;

    // 1. Примитивные и структурные проверки типов
    if (
      typeof p.id !== 'string' ||
      typeof p.name !== 'string' ||
      typeof p.type !== 'string' ||
      typeof p.capacity !== 'number' ||
      typeof p.lighting !== 'string' ||
      typeof p.noiseLevel !== 'string' ||
      typeof p.humidity !== 'string' ||
      typeof p.humanPresence !== 'string' ||
      typeof p.hasAttic !== 'boolean' ||
      typeof p.hasCellar !== 'boolean' ||
      typeof p.hasMirrors !== 'boolean' ||
      (p.description !== undefined && typeof p.description !== 'string') ||
      (p.tags !== undefined && (!Array.isArray(p.tags) || !p.tags.every(t => typeof t === 'string')))
    ) {
      return false;
    }

    // 2. Проверка допустимых значений enum/union
    if (
      !VALID_PLACE_LIGHTING.has(p.lighting) ||
      !VALID_PLACE_NOISE.has(p.noiseLevel) ||
      !VALID_PLACE_HUMIDITY.has(p.humidity) ||
      !VALID_PLACE_HUMAN_PRESENCE.has(p.humanPresence)
    ) {
      return false;
    }

    return true;
  });

  if (isGhostsValid && isPlacesValid) {
    return {
      ghosts: candidate.ghosts as GhostApplication[],
      places: candidate.places as RelocationPlace[]
    };
  }

  return null;
}

export const BureauContext = createContext<BureauContextValue | null>(null);

export const BureauProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationStep, setAllocationStep] = useState<string | null>(null);
  const [allocationStageNumber, setAllocationStageNumber] = useState(1);
  const [recentlyUpdatedGhostIds, setRecentlyUpdatedGhostIds] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState('только что');

  const [state, dispatch] = useReducer(bureauReducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const validated = validateBureauStorage(parsed);
        if (validated) {
          const alloc = allocateGhostsToPlaces(validated.ghosts, validated.places);
          return {
            ghosts: validated.ghosts,
            places: validated.places,
            allocation: alloc,
            activeView: 'dashboard' as const,
            selectedGhostId: null
          };
        }
      }
    } catch {
      // Игнорируем ошибку чтения localStorage и безопасно используем seed
    }

    const alloc = computeInitialAllocation(INITIAL_GHOSTS, INITIAL_PLACES);
    // При первоначальной загрузке сразу применяем результаты начального подбора
    const primedGhosts = INITIAL_GHOSTS.map(g => {
      const res = alloc.ghostResults[g.id];
      return {
        ...g,
        assignedPlaceId: res?.recommendedPlaceId || null,
        status: res?.status || 'new'
      };
    });

    return {
      ghosts: primedGhosts,
      places: INITIAL_PLACES,
      allocation: alloc,
      activeView: 'dashboard' as const,
      selectedGhostId: null
    };
  });

  // Автосохранение в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ghosts: state.ghosts,
          places: state.places
        })
      );
    } catch {
      // Ignore storage limit
    }
  }, [state.ghosts, state.places]);

  // Вычисление динамических показателей
  const stats: BureauStats = useMemo(() => {
    const totalGhosts = state.ghosts.length;
    let relocatedCount = 0;
    let relocatedAutoCount = 0;
    let relocatedManualCount = 0;
    let impossibleCount = 0;
    let needsAttentionCount = 0;
    let totalScoreSum = 0;
    let scoredCount = 0;

    for (const g of state.ghosts) {
      if (g.assignedPlaceId) {
        relocatedCount++;
        if (g.manualOverride) {
          relocatedManualCount++;
        } else {
          relocatedAutoCount++;
        }
        const evalScore = state.allocation.ghostResults[g.id]?.evaluations[g.assignedPlaceId]?.score;
        if (evalScore !== undefined) {
          totalScoreSum += evalScore;
          scoredCount++;
        }
      }

      if (g.status === 'impossible' || (!g.assignedPlaceId && state.allocation.ghostResults[g.id]?.status === 'impossible')) {
        impossibleCount++;
      }

      // Заявка требует внимания, если:
      // 1. Невозможно расселить (hard conflicts)
      // 2. Или еще не расселена (!assignedPlaceId)
      // 3. Или дедлайн просрочен / срочный (<= 24 ч.)
      if (g.status === 'impossible' || !g.assignedPlaceId || g.deadlineHoursLeft <= 24) {
        needsAttentionCount++;
      }
    }

    const unassignedCount = totalGhosts - relocatedCount;
    const totalCapacity = state.places.reduce((acc, p) => acc + p.capacity, 0);
    const totalOccupied = Object.values(state.allocation.placeOccupants).reduce(
      (acc, list) => acc + list.length,
      0
    );
    const availableSlots = Math.max(0, totalCapacity - totalOccupied);
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    const averageScore = scoredCount > 0 ? Math.round(totalScoreSum / scoredCount) : 0;

    return {
      totalGhosts,
      relocatedCount,
      relocatedAutoCount,
      relocatedManualCount,
      unassignedCount,
      impossibleCount,
      needsAttentionCount,
      totalCapacity,
      totalOccupied,
      availableSlots,
      occupancyPercent,
      averageScore
    };
  }, [state.ghosts, state.places, state.allocation]);

  const selectedGhost = useMemo(() => {
    if (!state.selectedGhostId) return null;
    return state.ghosts.find(g => g.id === state.selectedGhostId) || null;
  }, [state.ghosts, state.selectedGhostId]);

  const setView = (view: BureauState['activeView']) => dispatch({ type: 'SET_VIEW', view });
  const selectGhost = (ghostId: string | null) => dispatch({ type: 'SELECT_GHOST', ghostId });
  
  const assignManual = (ghostId: string, placeId: string, reason?: string) => {
    dispatch({ type: 'ASSIGN_MANUAL', ghostId, placeId, reason });
    setRecentlyUpdatedGhostIds([ghostId]);
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 800);
    setLastSyncTime('только что');
  };

  const unassignGhost = (ghostId: string) => {
    dispatch({ type: 'UNASSIGN_GHOST', ghostId });
    setRecentlyUpdatedGhostIds([ghostId]);
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 800);
    setLastSyncTime('только что');
  };

  const resetToSeed = () => {
    dispatch({ type: 'RESET_TO_SEED' });
    setLastSyncTime('только что');
  };

  const closeAllocationModal = useCallback(() => {
    setIsAllocating(false);
    setAllocationStep(null);
    setAllocationStageNumber(1);
  }, []);

  // Multi-stage auto-allocation pipeline (900-1400ms total, Requirement 5)
  const runAutoAllocation = useCallback(async () => {
    setIsAllocating(true);

    // СТАДИЯ 1: Проверяем заявки (10)
    setAllocationStageNumber(1);
    setAllocationStep('Проверяем заявки (10 заявок)');
    await new Promise(r => setTimeout(r, 260));

    // СТАДИЯ 2: Hard constraints (10 / 10)
    setAllocationStageNumber(2);
    setAllocationStep('Hard constraints (10 / 10 проверено)');
    await new Promise(r => setTimeout(r, 280));

    // СТАДИЯ 3: Calculating compatibility
    setAllocationStageNumber(3);
    setAllocationStep('Calculating compatibility (скоринг 0–100)');
    await new Promise(r => setTimeout(r, 290));

    // СТАДИЯ 4: Matching places
    setAllocationStageNumber(4);
    setAllocationStep('Matching places (подбор лучших укрытий)');
    await new Promise(r => setTimeout(r, 300));

    // СТАДИЯ 5: Динамический результат распределения
    const resetForAuto = state.ghosts.map(g => {
      if (g.manualOverride) return g;
      return { ...g, assignedPlaceId: null, status: 'new' as const };
    });
    const previewAllocation = allocateGhostsToPlaces(resetForAuto, state.places);
    let previewRelocated = 0;
    for (const g of resetForAuto) {
      if (g.manualOverride || previewAllocation.ghostResults[g.id]?.recommendedPlaceId) {
        previewRelocated++;
      }
    }
    const previewImpossible = state.ghosts.length - previewRelocated;

    setAllocationStageNumber(5);
    setAllocationStep(`✓ Результат: ${previewRelocated} расселено · ${previewImpossible} невозможно`);
    dispatch({ type: 'RUN_AUTO_ALLOCATION' });

    // Highlight all updated ghosts for subtle row glow (700ms)
    const allIds = state.ghosts.map(g => g.id);
    setRecentlyUpdatedGhostIds(allIds);
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 800);
    setLastSyncTime('только что');

    // Auto-dismiss after 4.5s if not manually clicked
    setTimeout(() => {
      setIsAllocating(prev => {
        if (prev) {
          setAllocationStep(null);
          setAllocationStageNumber(1);
        }
        return false;
      });
    }, 4500);
  }, [state.ghosts, state.places]);

  return (
    <BureauContext.Provider
      value={{
        state,
        dispatch,
        stats,
        selectedGhost,
        setView,
        selectGhost,
        assignManual,
        unassignGhost,
        runAutoAllocation,
        closeAllocationModal,
        resetToSeed,
        isAllocating,
        allocationStep,
        allocationStageNumber,
        recentlyUpdatedGhostIds,
        lastSyncTime
      }}
    >
      {children}
    </BureauContext.Provider>
  );
};

export function useBureau() {
  const ctx = useContext(BureauContext);
  if (!ctx) {
    throw new Error('useBureau must be used within a BureauProvider');
  }
  return ctx;
}
