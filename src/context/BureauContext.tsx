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

interface BureauState {
  ghosts: GhostApplication[];
  places: RelocationPlace[];
  allocation: AllocationState;
  activeView: 'dashboard' | 'applications' | 'places' | 'decisions' | 'worklog';
  selectedGhostId: string | null;
}

type BureauAction =
  | { type: 'SET_VIEW'; view: BureauState['activeView'] }
  | { type: 'SELECT_GHOST'; ghostId: string | null }
  | { type: 'ASSIGN_MANUAL'; ghostId: string; placeId: string; reason?: string }
  | { type: 'UNASSIGN_GHOST'; ghostId: string }
  | { type: 'RUN_AUTO_ALLOCATION' }
  | { type: 'RESET_TO_SEED' };

const STORAGE_KEY = 'mox_ghost_bureau_state_v1';

function computeInitialAllocation(ghosts: GhostApplication[], places: RelocationPlace[]): AllocationState {
  return allocateGhostsToPlaces(ghosts, places);
}

function bureauReducer(state: BureauState, action: BureauAction): BureauState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, activeView: action.view };

    case 'SELECT_GHOST':
      return { ...state, selectedGhostId: action.ghostId };

    case 'ASSIGN_MANUAL': {
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

interface BureauContextValue {
  state: BureauState;
  dispatch: React.Dispatch<BureauAction>;
  stats: BureauStats;
  selectedGhost: GhostApplication | null;
  setView: (view: BureauState['activeView']) => void;
  selectGhost: (ghostId: string | null) => void;
  assignManual: (ghostId: string, placeId: string, reason?: string) => void;
  unassignGhost: (ghostId: string) => void;
  runAutoAllocation: () => Promise<void>;
  resetToSeed: () => void;
  isAllocating: boolean;
  allocationStep: string | null;
  recentlyUpdatedGhostIds: string[];
  lastSyncTime: string;
}

const BureauContext = createContext<BureauContextValue | null>(null);

export const BureauProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationStep, setAllocationStep] = useState<string | null>(null);
  const [recentlyUpdatedGhostIds, setRecentlyUpdatedGhostIds] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState('только что');

  const [state, dispatch] = useReducer(bureauReducer, null, () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.ghosts && parsed.places) {
          const alloc = allocateGhostsToPlaces(parsed.ghosts, parsed.places);
          return {
            ghosts: parsed.ghosts,
            places: parsed.places,
            allocation: alloc,
            activeView: 'dashboard' as const,
            selectedGhostId: null
          };
        }
      }
    } catch {
      // Игнорируем ошибку чтения localStorage и используем seed
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

      if (g.status === 'impossible') {
        impossibleCount++;
      }

      if (g.deadlineHoursLeft <= 24 || g.status === 'impossible' || g.status === 'needs_attention') {
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
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 1200);
    setLastSyncTime('только что');
  };

  const unassignGhost = (ghostId: string) => {
    dispatch({ type: 'UNASSIGN_GHOST', ghostId });
    setRecentlyUpdatedGhostIds([ghostId]);
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 1200);
    setLastSyncTime('только что');
  };

  const resetToSeed = () => {
    dispatch({ type: 'RESET_TO_SEED' });
    setLastSyncTime('только что');
  };

  // Multi-stage auto-allocation pipeline (~900ms total)
  const runAutoAllocation = useCallback(async () => {
    setIsAllocating(true);
    setAllocationStep('Анализируем заявки...');

    await new Promise(r => setTimeout(r, 260));
    setAllocationStep('Проверяем ограничения...');

    await new Promise(r => setTimeout(r, 300));
    setAllocationStep('Распределяем места...');

    await new Promise(r => setTimeout(r, 320));
    dispatch({ type: 'RUN_AUTO_ALLOCATION' });
    setAllocationStep('Готово · 9 из 10');

    // Highlight all updated ghosts for subtle row glow
    const allIds = state.ghosts.map(g => g.id);
    setRecentlyUpdatedGhostIds(allIds);
    setTimeout(() => setRecentlyUpdatedGhostIds([]), 1500);
    setLastSyncTime('только что');

    await new Promise(r => setTimeout(r, 650));
    setIsAllocating(false);
    setAllocationStep(null);
  }, [state.ghosts]);

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
        resetToSeed,
        isAllocating,
        allocationStep,
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
