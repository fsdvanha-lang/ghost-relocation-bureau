import React from 'react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';

export const PlacesPage: React.FC = () => {
  const { state, selectGhost } = useBureau();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 border-b border-[#202326] pb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 tracking-tight">Места переселения</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Каталог локаций, физические параметры микроклимата и контроль свободной емкости
          </p>
        </div>
      </div>

      {/* Grid of Places - Clean, un-nested cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.places.map(place => {
          const occupantIds = state.allocation.placeOccupants[place.id] || [];
          const occupants = occupantIds
            .map(id => state.ghosts.find(g => g.id === id))
            .filter((g): g is NonNullable<typeof g> => !!g);

          const freeSlots = Math.max(0, place.capacity - occupants.length);
          const percent = Math.round((occupants.length / place.capacity) * 100);
          const isFull = freeSlots === 0;

          return (
            <div
              key={place.id}
              className="bg-[#111214] border border-[#202326] rounded-lg p-4 space-y-3.5 hover:border-[#2f3338] transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Header */}
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-500">{place.type}</span>
                    <h3 className="text-sm font-semibold text-zinc-200">{place.name}</h3>
                  </div>
                  {isFull ? (
                    <Badge variant="danger" size="sm">Заполнено</Badge>
                  ) : occupants.length > 0 ? (
                    <Badge variant="warning" size="sm">{occupants.length}/{place.capacity}</Badge>
                  ) : (
                    <Badge variant="success" size="sm">Свободно ({place.capacity})</Badge>
                  )}
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">{place.description}</p>

                {/* Slots Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>Слоты</span>
                    <span>{occupants.length} из {place.capacity} ({percent}%)</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Attributes Table */}
                <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[11px] pt-1 text-zinc-400 border-t border-[#1b1d20]">
                  <div>Свет: <span className="text-zinc-300 font-medium">{lightingLabels[place.lighting]}</span></div>
                  <div>Шум: <span className="text-zinc-300 font-medium">{noiseLabels[place.noiseLevel]}</span></div>
                  <div>Сырость: <span className="text-zinc-300 font-medium">{humidityLabels[place.humidity]}</span></div>
                  <div>Люди: <span className="text-zinc-300 font-medium">{humanLabels[place.humanPresence]}</span></div>
                </div>

                {/* Structural Tags */}
                <div className="flex flex-wrap gap-1 pt-1 text-[10px] text-zinc-500">
                  {place.hasAttic && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Чердак</span>}
                  {place.hasCellar && <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">Подвал</span>}
                  {place.hasMirrors && <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/30">Зеркала</span>}
                </div>
              </div>

              {/* Occupants */}
              <div className="pt-3 border-t border-[#1b1d20] space-y-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
                  Жильцы ({occupants.length}):
                </span>
                {occupants.length === 0 ? (
                  <span className="text-xs text-zinc-600 italic block">Свободно</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {occupants.map(ghost => (
                      <button
                        key={ghost.id}
                        onClick={() => selectGhost(ghost.id)}
                        className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] transition-colors"
                      >
                        {ghost.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
