import React, { useState } from 'react';
import { X, Sparkles, UserCheck, Thermometer, Brain, MapPin, Undo2 } from 'lucide-react';
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
      <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden">
          {/* Drawer Header */}
          <div className="p-5 border-b border-slate-800 flex items-start justify-between bg-slate-900/90">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">{ghost.name}</h3>
                <span className="text-xs font-mono text-slate-400">ID: {ghost.id}</span>
                {ghost.manualOverride && (
                  <Badge variant="purple" size="sm">
                    Ручной выбор
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-400">{ghost.bio || 'Заявка на переселение'}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {/* Parameters Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Уровень тревожности:</span>
                </div>
                <div>
                  <Badge
                    variant={
                      ghost.anxietyLevel === 'high'
                        ? 'danger'
                        : ghost.anxietyLevel === 'medium'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {anxietyLabels[ghost.anxietyLevel]}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Thermometer className="w-3.5 h-3.5 text-sky-400" />
                  <span>Температура:</span>
                </div>
                <div className="text-xs font-semibold text-slate-200">
                  {tempLabels[ghost.preferredTemperature]}
                </div>
              </div>

              <div className="space-y-1 col-span-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Дедлайн переселения:</span>
                  <DeadlineBadge hoursLeft={ghost.deadlineHoursLeft} />
                </div>
              </div>
            </div>

            {/* Special Conditions */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Специальные требования и фобии:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ghost.specialRequirements.isolatedFromHumans && (
                  <Badge variant="danger" size="sm">
                    🚫 Нельзя рядом с людьми (Hard)
                  </Badge>
                )}
                {ghost.specialRequirements.requiresAttic && (
                  <Badge variant="warning" size="sm">
                    🏠 Нужен чердак (Hard)
                  </Badge>
                )}
                {ghost.specialRequirements.requiresCellar && (
                  <Badge variant="warning" size="sm">
                    🗝️ Нужен подвал (Hard)
                  </Badge>
                )}
                {ghost.specialRequirements.noMirrors && (
                  <Badge variant="danger" size="sm">
                    🪞 Боится зеркал (Hard)
                  </Badge>
                )}
                {ghost.specialRequirements.prefersSilence && (
                  <Badge variant="info" size="sm">
                    🤫 Любит тишину
                  </Badge>
                )}
                {ghost.specialRequirements.likesDampness && (
                  <Badge variant="info" size="sm">
                    💧 Любит сырость
                  </Badge>
                )}
                {ghost.specialRequirements.prefersDarkness && (
                  <Badge variant="purple" size="sm">
                    🌑 Предпочитает темноту
                  </Badge>
                )}
                {Object.keys(ghost.specialRequirements).length === 0 && (
                  <span className="text-xs text-slate-500 italic">Специфических ограничений нет</span>
                )}
              </div>
            </div>

            {/* Current Relocation Target */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {ghost.assignedPlaceId ? 'Текущее место обитания' : 'Рекомендованное место'}
                </span>
                {ghost.assignedPlaceId && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Расселено</span>
                  </span>
                )}
              </div>

              {activePlace ? (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold text-slate-100 text-sm">{activePlace.name}</span>
                    </div>
                    <Badge variant="default" size="sm">
                      {activePlace.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{activePlace.description}</p>
                </div>
              ) : (
                <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-xl p-4 text-center text-xs text-slate-400">
                  Место еще не выбрано или переселение невозможно
                </div>
              )}

              {/* Match Factors Breakdown */}
              <MatchBreakdown
                evaluation={activeEvaluation}
                placeName={activePlace?.name}
                displacementReason={displacementReason}
                impossibleReasons={impossibleReasons}
              />
            </div>
          </div>

          {/* Drawer Actions Footer */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-3">
            {ghost.assignedPlaceId ? (
              <button
                onClick={() => onUnassign(ghost.id)}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/60 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Снять назначение</span>
              </button>
            ) : recommendedPlaceId ? (
              <button
                onClick={() => onManualAssign(ghost.id, recommendedPlaceId, 'Принятие рекомендации алгоритма')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/40 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Заселить по рекомендации</span>
              </button>
            ) : null}

            <button
              onClick={() => setShowManualModal(true)}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-950/40 transition-colors"
            >
              <span>{ghost.assignedPlaceId ? 'Изменить место вручную' : 'Выбрать место вручную'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Manual Assign Modal */}
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
