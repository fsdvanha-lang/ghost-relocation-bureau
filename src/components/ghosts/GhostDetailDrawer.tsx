import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { GhostApplication } from '../../types/ghost';
import type { RelocationPlace } from '../../types/place';
import type { PlaceMatchEvaluation } from '../../types/matching';
import { Badge } from '../common/Badge';
import { DeadlineBadge } from '../common/DeadlineBadge';
import { MatchBreakdown } from '../matching/MatchBreakdown';
import { ManualAssignModal } from '../matching/ManualAssignModal';

interface GhostDetailDrawerProps {
  ghost: GhostApplication | null;
  places: RelocationPlace[];
  evaluations: Record<string, PlaceMatchEvaluation>;
  placeOccupants: Record<string, string[]>;
  recommendedPlaceId: string | null;
  displacementReason?: string;
  impossibleReasons?: string[];
  isOpen: boolean;
  onClose: () => void;
  onManualAssign: (ghostId: string, placeId: string, reason?: string) => void;
  onUnassign: (ghostId: string) => void;
}

export const GhostDetailDrawer: React.FC<GhostDetailDrawerProps> = ({
  ghost,
  places,
  evaluations,
  placeOccupants,
  recommendedPlaceId,
  displacementReason,
  impossibleReasons,
  isOpen,
  onClose,
  onManualAssign,
  onUnassign
}) => {
  const [showManualModal, setShowManualModal] = useState(false);

  if (!isOpen || !ghost) return null;

  const activePlaceId = ghost.assignedPlaceId || recommendedPlaceId;
  const activePlace = activePlaceId ? places.find(p => p.id === activePlaceId) : null;
  const activeEvaluation = activePlaceId ? evaluations[activePlaceId] : undefined;

  const anxietyLabels = {
    low: 'Низкая',
    medium: 'Средняя',
    high: 'Высокая'
  };

  const tempLabels = {
    freezing: 'Ледяная',
    cold: 'Холодная',
    cool: 'Прохладная',
    moderate: 'Умеренная',
    warm: 'Тёплая'
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-black/50">
        <div className="w-full max-w-lg bg-[#111214] border-l border-[#202326] h-full flex flex-col shadow-2xl">
          {/* HEADER */}
          <div className="p-5 border-b border-[#202326] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100">{ghost.name}</h2>
                <span className="text-xs font-mono text-zinc-500">#{ghost.id}</span>
              </div>
              <div>
                {ghost.assignedPlaceId ? (
                  <Badge variant="success" size="sm">
                    {ghost.manualOverride ? 'Назначено вручную' : 'Расселено автоматически'}
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">В обработке</Badge>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CONTENT: Clean structured sections with dividers */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 divide-y divide-[#202326]">
            {/* 1. BASIC INFO */}
            <div className="space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Параметры привидения
              </span>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="text-zinc-500 text-[11px]">Тревожность</div>
                  <div className="text-zinc-200 font-medium mt-0.5">{anxietyLabels[ghost.anxietyLevel]}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[11px]">Температура</div>
                  <div className="text-zinc-200 font-medium mt-0.5">{tempLabels[ghost.preferredTemperature]}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-[11px]">Дедлайн</div>
                  <div className="mt-0.5">
                    <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. REQUIREMENTS (Hard constraints & soft prefs) */}
            <div className="pt-4 space-y-2 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Ограничения и условия
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ghost.specialRequirements.isolatedFromHumans && (
                  <Badge variant="danger" size="sm">Изоляция от людей (Hard)</Badge>
                )}
                {ghost.specialRequirements.requiresAttic && (
                  <Badge variant="warning" size="sm">Обязателен чердак (Hard)</Badge>
                )}
                {ghost.specialRequirements.requiresCellar && (
                  <Badge variant="warning" size="sm">Обязателен подвал (Hard)</Badge>
                )}
                {ghost.specialRequirements.noMirrors && (
                  <Badge variant="danger" size="sm">Без зеркал (Hard)</Badge>
                )}
                {ghost.specialRequirements.prefersSilence && (
                  <Badge variant="default" size="sm">Предпочитает тишину</Badge>
                )}
                {ghost.specialRequirements.likesDampness && (
                  <Badge variant="default" size="sm">Любит сырость</Badge>
                )}
                {Object.keys(ghost.specialRequirements).length === 0 && (
                  <span className="text-zinc-500 italic">Специфических ограничений нет</span>
                )}
              </div>
            </div>

            {/* 3. RECOMMENDATION & WHY THIS PLACE */}
            <div className="pt-4 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                {ghost.assignedPlaceId ? 'Назначенное место' : 'Рекомендация алгоритма'}
              </span>

              {activePlace ? (
                <div className="text-xs space-y-1">
                  <div className="text-sm font-semibold text-zinc-100">{activePlace.name}</div>
                  <p className="text-zinc-400 text-xs leading-relaxed">{activePlace.description}</p>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">
                  Подходящего места нет в доступном пуле
                </div>
              )}

              <MatchBreakdown
                evaluation={activeEvaluation}
                placeName={activePlace?.name}
                displacementReason={displacementReason}
                impossibleReasons={impossibleReasons}
              />
            </div>
          </div>

          {/* ACTIONS */}
          <div className="p-4 border-t border-[#202326] bg-[#0e1012] flex items-center justify-between gap-3">
            {ghost.assignedPlaceId ? (
              <button
                onClick={() => onUnassign(ghost.id)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
              >
                Снять назначение
              </button>
            ) : recommendedPlaceId ? (
              <button
                onClick={() => onManualAssign(ghost.id, recommendedPlaceId, 'Принятие рекомендации')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors"
              >
                Назначить рекомендацию
              </button>
            ) : <div />}

            <button
              onClick={() => setShowManualModal(true)}
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              {ghost.assignedPlaceId ? 'Изменить место' : 'Выбрать место'}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Assign Decision Modal */}
      <ManualAssignModal
        ghost={ghost}
        places={places}
        evaluations={evaluations}
        placeOccupants={placeOccupants}
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirmAssign={onManualAssign}
      />
    </>
  );
};
