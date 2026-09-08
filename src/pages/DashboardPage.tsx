import React, { useState, useMemo } from 'react';
import { 
  Check, 
  XCircle, 
  AlertTriangle, 
  Search, 
  MapPin, 
  User, 
  MoreHorizontal, 
  ArrowRight,
  Zap,
  Home
} from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { GhostAvatar } from '../components/common/GhostAvatar';
import { ScoreRing } from '../components/common/ScoreRing';
import { CastleHeaderBanner } from '../components/common/CastleHeaderBanner';
import { AnimatedNumber } from '../components/common/AnimatedNumber';
import { useToast } from '../components/common/ToastContext';

export const DashboardPage: React.FC = () => {
  const { 
    state, 
    stats, 
    selectGhost, 
    setView, 
    runAutoAllocation,
    isAllocating,
    allocationStep,
    recentlyUpdatedGhostIds,
    lastSyncTime
  } = useBureau();

  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'new' | 'matched' | 'relocated' | 'problem'>('all');

  // Trigger multi-stage auto allocation with progress & toast feedback
  const handleAutoAllocate = async () => {
    if (isAllocating) return;
    try {
      await runAutoAllocation();
      showToast({
        type: 'success',
        title: 'Авто-подбор завершён',
        message: `${stats.relocatedCount} из ${stats.totalGhosts} привидений оптимально расселены`
      });
    } catch {
      showToast({
        type: 'warning',
        title: 'Ошибка подбора',
        message: 'Проверьте доступность мест и правила ограничений'
      });
    }
  };

  // Section 1: "Требуют внимания (4)"
  const urgentGhosts = useMemo(() => {
    return state.ghosts
      .filter(g => g.deadlineHoursLeft <= 48 || g.status === 'impossible' || g.status === 'needs_attention')
      .sort((a, b) => a.deadlineHoursLeft - b.deadlineHoursLeft)
      .slice(0, 4);
  }, [state.ghosts]);

  // Section 2: Filtered Ghosts for the Main Table
  const filteredTableGhosts = useMemo(() => {
    return state.ghosts.filter(ghost => {
      const matchesSearch =
        ghost.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ghost.bio?.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      const result = state.allocation.ghostResults[ghost.id];
      if (tableFilter === 'new') return !ghost.assignedPlaceId && result?.status === 'new';
      if (tableFilter === 'matched') return !ghost.assignedPlaceId && !!result?.recommendedPlaceId;
      if (tableFilter === 'relocated') return !!ghost.assignedPlaceId;
      if (tableFilter === 'problem') return ghost.deadlineHoursLeft <= 24 || result?.status === 'impossible';

      return true;
    });
  }, [state.ghosts, state.allocation, searchQuery, tableFilter]);

  // Anxiety count distribution
  const anxietyCounts = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    for (const g of state.ghosts) {
      if (g.anxietyLevel === 'high') high++;
      else if (g.anxietyLevel === 'medium') medium++;
      else low++;
    }
    return { high, medium, low };
  }, [state.ghosts]);

  // Key 4 places for the "Загрузка мест" progress bars
  const displayPlaces = useMemo(() => {
    const targetIds = ['place-3', 'place-1', 'place-4', 'place-5'];
    return targetIds
      .map(id => state.places.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [state.places]);

  const anxietyBadges: Record<string, { label: string; bg: string; text: string }> = {
    high: { label: 'Высокая', bg: 'bg-rose-500/20 border-rose-500/30', text: 'text-rose-400' },
    medium: { label: 'Средняя', bg: 'bg-amber-500/20 border-amber-500/30', text: 'text-amber-400' },
    low: { label: 'Низкая', bg: 'bg-emerald-500/20 border-emerald-500/30', text: 'text-emerald-400' },
  };

  const tempLabels: Record<string, string> = {
    freezing: 'Ледяная',
    cold: 'Холодно',
    cool: 'Прохладно',
    moderate: 'Умеренно',
    warm: 'Тепло',
  };

  const formatDeadline = (hoursLeft: number) => {
    if (hoursLeft < 0) return 'Просрочен';
    if (hoursLeft <= 16) return '< 16 ч.';
    if (hoursLeft <= 24) return '< 24 ч.';
    if (hoursLeft <= 48) return '< 48 ч.';
    const days = Math.round(hoursLeft / 24);
    if (days === 1) return '1 день';
    if (days >= 2 && days <= 4) return `${days} дня`;
    return `${days} дней`;
  };

  return (
    <div className="space-y-6 select-none relative">
      {/* 1. TOP HEADER BANNER (Entrance 150ms) */}
      <div className="relative rounded-2xl bg-[#0e1320] border border-[#1b253b] p-6 overflow-hidden shadow-lg animate-entrance-2">
        <CastleHeaderBanner />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Subtitle + Live Bureau Pulse */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Добро пожаловать в бюро
              </h1>
              <span className="text-rose-400 text-lg">✨</span>

              {/* Living System Status Pill */}
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 bg-[#12192a] border border-[#1e2a42] px-3 py-1 rounded-full shadow-inner">
                <span className={`w-2 h-2 rounded-full ${isAllocating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                <span>
                  {isAllocating ? allocationStep || 'Анализируем...' : `Система стабильна · ${lastSyncTime}`}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Здесь вы распределяете привидений по подходящим местам обитания
            </p>
          </div>

          {/* Right Controls: Search, Status Chips, User, Auto-allocation Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Search Input */}
            <div className="relative w-60">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, локации..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Chip 1: Available Slots with Animated Number */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <AnimatedNumber value={stats.availableSlots} className="font-bold text-white font-mono" />
              <span className="text-slate-400">свободных мест</span>
            </div>

            {/* Chip 2: Needs Attention with Animated Number */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <AnimatedNumber value={stats.needsAttentionCount} className="font-bold font-mono" />
              <span className="text-amber-300/80">требуют внимания</span>
            </div>

            {/* Auto-allocate Button with multi-stage text */}
            <button
              onClick={handleAutoAllocate}
              disabled={isAllocating}
              className={`flex items-center gap-2 px-4 py-1.5 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200 ${
                isAllocating
                  ? 'bg-amber-600 shadow-amber-600/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/25 hover:scale-[1.02] active:scale-[0.98]'
              }`}
              title="Запустить алгоритм автоматического расселения"
            >
              <Zap className={`w-3.5 h-3.5 ${isAllocating ? 'animate-spin' : ''}`} />
              <span>{isAllocating ? allocationStep || 'Подбор...' : 'Запустить авто-подбор'}</span>
            </button>

            {/* Operator Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1e2a42] border border-[#2d3e61] flex items-center justify-center text-slate-300 shadow-inner">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FIVE KPI STATS CARDS (Entrance 220ms with Animated Numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 animate-entrance-3">
        {/* KPI 1: Всего заявок */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedNumber value={stats.totalGhosts} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Всего заявок</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#182338] border border-[#243350] flex items-center justify-center text-slate-300">
            <Home className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Расселено */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedNumber value={stats.relocatedCount} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Расселено</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: Без места */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedNumber value={stats.unassignedCount} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Без места</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Требуют внимания */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              <AnimatedNumber value={stats.needsAttentionCount} />
            </div>
            <div className="text-xs text-slate-400 mt-1">Требуют внимания</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 5: Загруженность мест (Animated ScoreRing) */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between shadow-sm">
          <ScoreRing
            score={stats.occupancyPercent}
            size={48}
            strokeWidth={4.5}
            colorClass="text-blue-500"
          />
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">Загруженность</div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {stats.totalOccupied} из {stats.totalCapacity} слотов
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1: ТРЕБУЮТ ВНИМАНИЯ (Entrance 300ms) */}
      <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-4 shadow-md animate-entrance-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Требуют внимания</h2>
            <span className="text-[11px] font-mono px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30">
              {stats.needsAttentionCount}
            </span>
          </div>

          <button
            onClick={() => setView('applications')}
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors group"
          >
            <span>Все заявки</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <div className="divide-y divide-[#172033]">
          {urgentGhosts.map(ghost => {
            const result = state.allocation.ghostResults[ghost.id];
            const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
            const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : 70;
            const anxietyStyle = anxietyBadges[ghost.anxietyLevel] || anxietyBadges.medium;
            const isOverdue = ghost.deadlineHoursLeft < 0;

            return (
              <div
                key={ghost.id}
                onClick={() => selectGhost(ghost.id)}
                className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#141b2c]/70 px-2.5 rounded-xl transition-all duration-180"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <GhostAvatar size="md" className="group-hover:scale-105 transition-transform duration-200" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        {ghost.name}
                      </span>
                      <span className={`px-2 py-0.2 text-[10px] rounded-full border ${anxietyStyle.bg} ${anxietyStyle.text} font-medium`}>
                        {anxietyStyle.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 max-w-sm">
                      {ghost.bio?.split('.')[0] || 'Заявка на расселение'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  {/* Deadline text */}
                  <div className={`text-xs font-medium min-w-[70px] text-right ${isOverdue ? 'text-rose-400 font-bold' : 'text-amber-400'}`}>
                    {formatDeadline(ghost.deadlineHoursLeft)}
                  </div>

                  {/* Score with subtle highlight on hover */}
                  <div className="text-xs font-mono font-bold text-slate-200 min-w-[40px] text-right group-hover:text-blue-400 transition-colors">
                    {evalScore ? `${evalScore}%` : '—'}
                  </div>

                  {/* Blue Action Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      selectGhost(ghost.id);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-180 hover:shadow-blue-500/25 active:scale-95"
                  >
                    Подобрать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION 2: ЗАЯВКИ ПРИВИДЕНИЙ (Entrance 400ms) */}
      <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-4 shadow-md animate-entrance-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white tracking-tight">Заявки привидений</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#182338] text-slate-300 border border-[#243350]">
              {state.ghosts.length}
            </span>
          </div>

          {/* Filter tabs with smooth transition */}
          <div className="flex items-center gap-1 bg-[#0a0e17] p-1 rounded-xl border border-[#182338] text-xs">
            <button
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                tableFilter === 'all' ? 'bg-[#1b263b] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setTableFilter('new')}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                tableFilter === 'new' ? 'bg-[#1b263b] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Новые
            </button>
            <button
              onClick={() => setTableFilter('matched')}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                tableFilter === 'matched' ? 'bg-[#1b263b] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Подобрано
            </button>
            <button
              onClick={() => setTableFilter('relocated')}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                tableFilter === 'relocated' ? 'bg-[#1b263b] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Расселено
            </button>
            <button
              onClick={() => setTableFilter('problem')}
              className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                tableFilter === 'problem' ? 'bg-[#1b263b] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Проблемные
            </button>
          </div>
        </div>

        {/* Table with row update animation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#182338] text-slate-400 font-medium">
                <th className="py-3 px-3 font-normal">Привидение</th>
                <th className="py-3 px-3 font-normal">Тревожность</th>
                <th className="py-3 px-3 font-normal">Температура</th>
                <th className="py-3 px-3 font-normal">Дедлайн</th>
                <th className="py-3 px-3 font-normal">Рекомендуемое место</th>
                <th className="py-3 px-3 font-normal">Score</th>
                <th className="py-3 px-3 font-normal">Статус</th>
                <th className="py-3 px-3 font-normal text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#151c2d]">
              {filteredTableGhosts.map(ghost => {
                const result = state.allocation.ghostResults[ghost.id];
                const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
                const activePlace = activePlaceId ? state.places.find(p => p.id === activePlaceId) : null;
                const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : undefined;
                const anxietyStyle = anxietyBadges[ghost.anxietyLevel] || anxietyBadges.medium;
                const isUpdated = recentlyUpdatedGhostIds.includes(ghost.id);

                let statusBadge = (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    Новая
                  </span>
                );
                if (ghost.assignedPlaceId) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Подобрано
                    </span>
                  );
                } else if (result?.status === 'impossible') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                      Невозможно
                    </span>
                  );
                } else if (ghost.deadlineHoursLeft <= 24) {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Требует решения
                    </span>
                  );
                }

                return (
                  <tr
                    key={ghost.id}
                    onClick={() => selectGhost(ghost.id)}
                    className={`hover:bg-[#141c2c] cursor-pointer transition-colors duration-150 ${
                      isUpdated ? 'animate-row-update' : ''
                    }`}
                  >
                    {/* Ghost Avatar + Name */}
                    <td className="py-3 px-3 font-medium text-slate-200">
                      <div className="flex items-center gap-2.5">
                        <GhostAvatar size="sm" />
                        <div>
                          <span className="font-semibold text-slate-100">{ghost.name}</span>
                          <span className="text-[11px] text-slate-500 ml-1.5 font-mono">#{ghost.id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Anxiety */}
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 text-[10px] rounded-full border ${anxietyStyle.bg} ${anxietyStyle.text}`}>
                        {anxietyStyle.label}
                      </span>
                    </td>

                    {/* Temperature */}
                    <td className="py-3 px-3 text-slate-300">
                      {tempLabels[ghost.preferredTemperature]}
                    </td>

                    {/* Deadline */}
                    <td className={`py-3 px-3 font-medium ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                      {formatDeadline(ghost.deadlineHoursLeft)}
                    </td>

                    {/* Recommended Place */}
                    <td className="py-3 px-3 text-slate-200 font-medium">
                      {activePlace ? activePlace.name : <span className="text-slate-600">—</span>}
                    </td>

                    {/* Score */}
                    <td className="py-3 px-3 font-mono font-bold">
                      {evalScore !== undefined ? (
                        <span className={evalScore >= 80 ? 'text-emerald-400' : 'text-slate-300'}>
                          {evalScore}%
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">{statusBadge}</td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          selectGhost(ghost.id);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1f2b42] transition-colors"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM ROW: 3 CARDS (Entrance 500ms) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-entrance-6">
        {/* Card 1: Загрузка мест with smooth progress bar transitions */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3.5 shadow-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Загрузка мест
          </h3>

          <div className="space-y-3 pt-1">
            {displayPlaces.map(place => {
              const occupants = state.allocation.placeOccupants[place.id] || [];
              const percent = Math.round((occupants.length / place.capacity) * 100);
              const isFull = occupants.length >= place.capacity;

              return (
                <div key={place.id} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-medium">
                    <span>{place.name}</span>
                    <span className="font-mono text-slate-400">
                      {occupants.length} / {place.capacity}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#172033] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${
                        isFull ? 'bg-rose-500' : percent > 50 ? 'bg-amber-400' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Статистика with animated donut ScoreRing */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3.5 shadow-md flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Статистика
          </h3>

          <div className="flex items-center justify-between gap-4 py-2">
            {/* Donut Score with animated counter & fill */}
            <div className="flex items-center gap-3">
              <ScoreRing
                score={90}
                size={58}
                strokeWidth={5}
                colorClass="text-blue-500"
              />
              <div>
                <div className="text-xs font-bold text-white">Средний score</div>
                <div className="text-[11px] text-slate-400">совместимости</div>
              </div>
            </div>

            {/* Anxiety breakdown */}
            <div className="space-y-1.5 text-xs text-right">
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-400">Высокая тревожность</span>
                <span className="font-bold font-mono text-slate-200">
                  <AnimatedNumber value={anxietyCounts.high} />
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-400">Средняя тревожность</span>
                <span className="font-bold font-mono text-slate-200">
                  <AnimatedNumber value={anxietyCounts.medium} />
                </span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-400">Низкая тревожность</span>
                <span className="font-bold font-mono text-slate-200">
                  <AnimatedNumber value={anxietyCounts.low} />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Проблемные заявки */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3.5 shadow-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Проблемные заявки
          </h3>

          <div className="space-y-2.5 pt-1 text-xs">
            {/* 1. Louise: Overdue */}
            <div
              onClick={() => selectGhost('ghost-4')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors duration-150 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">Луиза</span>
              </div>
              <span className="text-rose-400 text-[11px] font-medium">Просрочен дедлайн</span>
            </div>

            {/* 2. Bartholomew: Critical deadline */}
            <div
              onClick={() => selectGhost('ghost-5')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors duration-150 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">Варфоломей</span>
              </div>
              <span className="text-amber-400 text-[11px] font-medium">Критический дедлайн</span>
            </div>

            {/* 3. Seraphima: Low score */}
            <div
              onClick={() => selectGhost('ghost-7')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors duration-150 group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-slate-200 group-hover:text-white transition-colors">Серафима</span>
              </div>
              <span className="text-amber-400 text-[11px] font-medium">Низкий score (58%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
