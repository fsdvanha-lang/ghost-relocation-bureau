import React, { useState } from 'react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';
import { PlaceThumbnail } from '../components/common/PlaceThumbnail';
import { LocationDetailModal } from '../components/locations/LocationDetailModal';
import { SpotlightCard } from '../components/common/SpotlightCard';
import { sound } from '../utils/audioSystem';
import type { RelocationPlace } from '../types/place';

export const PlacesPage: React.FC = () => {
  const { state, selectGhost } = useBureau();
  const [selectedPlaceForModal, setSelectedPlaceForModal] = useState<RelocationPlace | null>(null);

  const lightingLabels = {
    very_low: 'Сумрак',
    low: 'Низкое',
    medium: 'Среднее',
    high: 'Яркое'
  };

  const noiseLabels = {
    silent: 'Тишина',
    low: 'Низкий',
    medium: 'Умеренный',
    high: 'Шумно'
  };

  const humidityLabels = {
    low: 'Сухо',
    medium: 'Умеренно',
    high: 'Сырость'
  };

  const humanLabels = {
    none: 'Нет людей',
    rare: 'Редко',
    sometimes: 'Иногда',
    frequent: 'Часто',
    constant: 'Постоянно'
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F3F3F0] shadow-[0_0_8px_#F3F3F0]" />
            <span className="font-heading uppercase tracking-[0.16em] text-[10px] text-[#7B7B78] font-bold">
              Архитектурный реестр
            </span>
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[#F3F3F0] tracking-tight uppercase">
            Места расселения
          </h2>
          <p className="text-xs text-[#7B7B78] mt-1">
            Каталог локаций, физические параметры микроклимата и контроль свободной емкости
          </p>
        </div>
      </div>

      {/* Grid of Places */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.places.map(place => {
          const occupantIds = state.allocation.placeOccupants[place.id] || [];
          const occupants = occupantIds
            .map(id => state.ghosts.find(g => g.id === id))
            .filter((g): g is NonNullable<typeof g> => !!g);

          const freeSlots = Math.max(0, place.capacity - occupants.length);
          const percent = Math.round((occupants.length / place.capacity) * 100);
          const isFull = freeSlots === 0;

          return (
            <SpotlightCard
              key={place.id}
              enableTilt={true}
              onClick={() => {
                sound.playClick();
                setSelectedPlaceForModal(place);
              }}
              className="group rounded-2xl p-4 sm:p-5 space-y-4 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <PlaceThumbnail
                  placeType={place.type}
                  placeId={place.id}
                  className="w-full h-32 rounded-xl border border-white/[0.08]"
                />

                {/* Header */}
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-heading tracking-[0.14em] text-[#7B7B78] font-bold">
                      {place.type}
                    </span>
                    <h3 className="font-display font-bold text-base text-[#F3F3F0] tracking-tight mt-0.5 group-hover:text-white transition-colors">
                      {place.name}
                    </h3>
                  </div>
                  {isFull ? (
                    <Badge variant="danger" size="sm">Заполнено</Badge>
                  ) : occupants.length > 0 ? (
                    <Badge variant="warning" size="sm">{occupants.length}/{place.capacity}</Badge>
                  ) : (
                    <Badge variant="success" size="sm">Свободно ({place.capacity})</Badge>
                  )}
                </div>

                <p className="text-xs text-[#9d9d99] leading-relaxed line-clamp-2">{place.description}</p>

                {/* Slots Bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-[#7B7B78] font-mono">
                    <span className="font-heading uppercase tracking-wider text-[10px]">Вместимость</span>
                    <span>{occupants.length} из {place.capacity} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Attributes Table */}
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] pt-2 text-[#7B7B78] border-t border-white/[0.06]">
                  <div>Свет: <span className="text-[#E8E6E1] font-medium">{lightingLabels[place.lighting]}</span></div>
                  <div>Шум: <span className="text-[#E8E6E1] font-medium">{noiseLabels[place.noiseLevel]}</span></div>
                  <div>Сырость: <span className="text-[#E8E6E1] font-medium">{humidityLabels[place.humidity]}</span></div>
                  <div>Люди: <span className="text-[#E8E6E1] font-medium">{humanLabels[place.humanPresence]}</span></div>
                </div>

                {/* Structural Tags */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  {place.hasAttic && <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#E8E6E1] border border-white/[0.08]">Чердак</span>}
                  {place.hasCellar && <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#E8E6E1] border border-white/[0.08]">Подвал</span>}
                  {place.hasMirrors && <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/25">Зеркала</span>}
                </div>
              </div>

              {/* Occupants */}
              <div className="pt-3 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] font-heading font-bold uppercase tracking-[0.14em] text-[#7B7B78] block">
                  Размещенные сущности ({occupants.length}):
                </span>
                {occupants.length === 0 ? (
                  <span className="text-xs text-[#7B7B78] italic block">Локация свободна</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {occupants.map(ghost => (
                      <button
                        key={ghost.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="px-2.5 py-1 bg-white/[0.06] hover:bg-white/[0.12] text-[#F3F3F0] rounded-lg text-xs font-heading font-medium transition-colors border border-white/[0.08] cursor-pointer"
                        title="Открыть инспектор этого привидения"
                      >
                        {ghost.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* Location Detail Modal */}
      <LocationDetailModal
        place={selectedPlaceForModal}
        occupants={
          selectedPlaceForModal 
            ? (state.allocation.placeOccupants[selectedPlaceForModal.id] || [])
                .map(id => state.ghosts.find(g => g.id === id))
                .filter((g): g is NonNullable<typeof g> => !!g)
            : []
        }
        isOpen={!!selectedPlaceForModal}
        onClose={() => setSelectedPlaceForModal(null)}
      />
    </div>
  );
};
