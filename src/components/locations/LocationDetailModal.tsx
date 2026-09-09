import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Sun, Droplets, UserX, Home, ShieldAlert } from 'lucide-react';
import type { RelocationPlace } from '../../types/place';
import type { GhostApplication } from '../../types/ghost';
import { PlaceThumbnail } from '../common/PlaceThumbnail';
import { GhostAvatar } from '../common/GhostAvatar';

interface LocationDetailModalProps {
  place: RelocationPlace | null;
  occupants: GhostApplication[];
  isOpen: boolean;
  onClose: () => void;
}

const LIGHTING_LABELS: Record<string, string> = {
  pitch_black: 'Полная тьма',
  dim: 'Приглушенный полумрак',
  bright: 'Яркий дневной свет'
};

const NOISE_LABELS: Record<string, string> = {
  silent: 'Гробовая тишина',
  low: 'Тихий шелест',
  medium: 'Умеренный шум',
  high: 'Высокий шум'
};

const HUMIDITY_LABELS: Record<string, string> = {
  dry: 'Сухой воздух',
  normal: 'Умеренная влажность',
  high: 'Высокая сырость'
};

const HUMAN_LABELS: Record<string, string> = {
  none: 'Людей нет',
  rare: 'Редкие визиты',
  frequent: 'Частое присутствие'
};

export const LocationDetailModal: React.FC<LocationDetailModalProps> = ({
  place,
  occupants,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !place) return null;

  const freeSlots = Math.max(0, place.capacity - occupants.length);
  const percent = Math.round((occupants.length / place.capacity) * 100);
  const isFull = freeSlots === 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
    >
      <div 
        className="bg-[#0c0c0f] border border-white/[0.1] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden animate-modal-scale"
      >
        {/* Large Hero Image (Shared-element zoom feel, Finely Crafted / CUSP inspired) */}
        <div className="relative h-56 w-full overflow-hidden shrink-0 group">
          <PlaceThumbnail
            placeId={place.id}
            placeType={place.type}
            name={place.name}
            className="w-full h-full object-cover scale-100 group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          />
          {/* Radial & Linear gradient overlay for editorial elegance */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0f] via-[#0c0c0f]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-[#9E9E9A] hover:text-[#F3F3F0] border border-white/15 transition-all shadow-md active:scale-95"
            aria-label="Закрыть окно"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Place Title Badge Overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/90 border border-white/20 text-[10px] font-heading font-semibold uppercase tracking-wider backdrop-blur-xs">
                {place.type}
              </span>
              <h2 id="location-modal-title" className="font-display font-black text-2xl text-[#F3F3F0] tracking-tight mt-1">
                {place.name}
              </h2>
            </div>

            <div className="text-right shrink-0">
              <span className={`px-3 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wider border shadow-sm ${
                isFull 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/35' 
                  : freeSlots === 1 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/35' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
              }`}>
                {isFull ? 'Заполнено' : `${freeSlots} из ${place.capacity} свободно`}
              </span>
            </div>
          </div>
        </div>

        {/* Scrollable Details Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Description */}
          <p className="text-[#B4B4AF] leading-relaxed text-xs">
            {place.description}
          </p>

          {/* Capacity Meter Bar */}
          <div className="p-3.5 rounded-xl bg-[#121217] border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between font-mono text-[11px] text-[#9E9E9A]">
              <span className="font-heading uppercase tracking-wider text-[10px]">Заполненность укрытия</span>
              <span className="font-bold text-[#F3F3F0]">{occupants.length} / {place.capacity} мест ({percent}%)</span>
            </div>
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-[#F3F3F0]'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Microclimate & Atmosphere Parameters Grid */}
          <div className="space-y-2">
            <span className="text-[10px] font-heading font-bold uppercase tracking-[0.14em] text-[#7B7B78] block">
              Параметры микроклимата и среды
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Освещение</span>
                </div>
                <div className="font-heading font-semibold text-[#F3F3F0] text-xs">
                  {LIGHTING_LABELS[place.lighting] || place.lighting}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
                  <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Уровень шума</span>
                </div>
                <div className="font-heading font-semibold text-[#F3F3F0] text-xs">
                  {NOISE_LABELS[place.noiseLevel] || place.noiseLevel}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
                  <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Влажность</span>
                </div>
                <div className="font-heading font-semibold text-[#F3F3F0] text-xs">
                  {HUMIDITY_LABELS[place.humidity] || place.humidity}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#121217] border border-white/[0.06] space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-heading uppercase tracking-wider text-[#7B7B78]">
                  <UserX className="w-3.5 h-3.5 text-purple-400" />
                  <span>Люди</span>
                </div>
                <div className="font-heading font-semibold text-[#F3F3F0] text-xs">
                  {HUMID_LABELS_FALLBACK(place.humanPresence)}
                </div>
              </div>
            </div>
          </div>

          {/* Architectural Constraints Flags */}
          <div className="flex flex-wrap gap-2 pt-1">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-heading font-medium flex items-center gap-1.5 ${
              place.hasAttic ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/[0.04] text-[#7B7B78] border border-white/[0.06]'
            }`}>
              <Home className="w-3 h-3" />
              <span>{place.hasAttic ? 'Чердак присутствует' : 'Чердака нет'}</span>
            </span>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-heading font-medium flex items-center gap-1.5 ${
              place.hasCellar ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-white/[0.04] text-[#7B7B78] border border-white/[0.06]'
            }`}>
              <span>{place.hasCellar ? '✓ Подвал есть' : '✕ Без подвала'}</span>
            </span>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-heading font-medium flex items-center gap-1.5 ${
              place.hasMirrors ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
            }`}>
              <ShieldAlert className="w-3 h-3" />
              <span>{place.hasMirrors ? '⚠ Есть зеркала (риск для спектрофобов)' : '✓ Без зеркал'}</span>
            </span>
          </div>

          {/* Occupants Section */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <span className="text-[10px] font-heading font-bold uppercase tracking-[0.14em] text-[#7B7B78] block">
              Размещенные привидения ({occupants.length})
            </span>

            {occupants.length === 0 ? (
              <div className="p-4 rounded-xl bg-[#121217] border border-white/[0.06] text-center text-[#7B7B78] italic font-mono">
                В этой локации пока никто не проживает. Локация готова к заселению.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {occupants.map(ghost => (
                  <div 
                    key={ghost.id} 
                    className="p-3 rounded-xl bg-[#121217] border border-white/[0.06] flex items-center gap-3"
                  >
                    <GhostAvatar size="sm" ghostId={ghost.id} className="w-9 h-9 rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <div className="font-display font-bold text-xs text-[#F3F3F0] truncate">{ghost.name}</div>
                      <div className="text-[10px] text-[#7B7B78] font-mono mt-0.5">#{ghost.id} · Размещен</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-[#08080a] border-t border-white/[0.08] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#F3F3F0] text-[#08080a] hover:bg-white text-xs font-heading font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

function HUMID_LABELS_FALLBACK(val: string) {
  return HUMAN_LABELS[val] || val;
}
