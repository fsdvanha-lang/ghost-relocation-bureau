import React from 'react';
import { Sun, Volume2, Droplets, Eye } from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { Badge } from '../components/common/Badge';

export const PlacesPage: React.FC = () => {
  const { state, selectGhost } = useBureau();

  const lightingLabels = {
    very_low: 'Очень низкое (сумрак)',
    low: 'Низкое',
    medium: 'Среднее',
    high: 'Высокое (яркое)'
  };

  const noiseLabels = {
    silent: 'Абсолютная тишина',
    low: 'Низкий',
    medium: 'Умеренный',
    high: 'Высокий (шумно)'
  };

  const humidityLabels = {
    low: 'Сухой воздух',
    medium: 'Умеренная влажность',
    high: 'Высокая сырость'
  };

  const humanLabels = {
    none: 'Людей нет (полная изоляция)',
    rare: 'Редко появляются',
    sometimes: 'Иногда бывают',
    frequent: 'Частые визиты',
    constant: 'Постоянно присутствуют'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Каталог локаций переселения</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Физические характеристики объектов, контроль емкости и распределение жильцов
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">Свободно</Badge>
          <Badge variant="warning">Частично занято</Badge>
          <Badge variant="danger">Заполнено</Badge>
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
            <div
              key={place.id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-indigo-400 font-mono font-semibold">
                      {place.type}
                    </span>
                    <h4 className="text-base font-bold text-slate-100">{place.name}</h4>
                  </div>
                  {isFull ? (
                    <Badge variant="danger">Заполнено</Badge>
                  ) : occupants.length > 0 ? (
                    <Badge variant="warning">Занято {occupants.length}/{place.capacity}</Badge>
                  ) : (
                    <Badge variant="success">Свободно {place.capacity}</Badge>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 leading-relaxed">{place.description}</p>

                {/* Capacity progress bar */}
                <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Заполненность слотов:</span>
                    <span className="font-mono font-semibold text-slate-200">
                      {occupants.length} из {place.capacity} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Physical traits */}
                <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> Освещение:
                    </span>
                    <span className="font-medium text-slate-200">{lightingLabels[place.lighting]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Шум:
                    </span>
                    <span className="font-medium text-slate-200">{noiseLabels[place.noiseLevel]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-blue-400" /> Влажность:
                    </span>
                    <span className="font-medium text-slate-200">{humidityLabels[place.humidity]}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-purple-400" /> Люди:
                    </span>
                    <span className="font-medium text-slate-200">{humanLabels[place.humanPresence]}</span>
                  </div>
                </div>

                {/* Structural Features */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    place.hasAttic ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50' : 'bg-slate-800/40 text-slate-500 border-slate-700/40'
                  }`}>
                    Чердак: {place.hasAttic ? '✓ Да' : '✕ Нет'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    place.hasCellar ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50' : 'bg-slate-800/40 text-slate-500 border-slate-700/40'
                  }`}>
                    Подвал: {place.hasCellar ? '✓ Да' : '✕ Нет'}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                    place.hasMirrors ? 'bg-amber-950/50 text-amber-300 border-amber-800/50' : 'bg-slate-800/40 text-slate-400 border-slate-700/40'
                  }`}>
                    Зеркала: {place.hasMirrors ? '⚠ Есть' : '✓ Нет'}
                  </span>
                </div>
              </div>

              {/* Occupants list */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                  Текущие жильцы ({occupants.length}):
                </span>
                {occupants.length === 0 ? (
                  <span className="text-xs text-slate-500 italic block">Локация пока свободна</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {occupants.map(ghost => (
                      <button
                        key={ghost.id}
                        onClick={() => selectGhost(ghost.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors flex items-center gap-1.5"
                        title="Открыть анкету привидения"
                      >
                        <span>{ghost.name}</span>
                        {ghost.manualOverride && <span className="text-[9px] text-indigo-300 font-mono">(рук)</span>}
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
