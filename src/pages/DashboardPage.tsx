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
  Sparkles,
  Home
} from 'lucide-react';
import { useBureau } from '../context/BureauContext';
import { GhostAvatar } from '../components/common/GhostAvatar';
import { ScoreRing } from '../components/common/ScoreRing';
import { CastleHeaderBanner } from '../components/common/CastleHeaderBanner';

export const DashboardPage: React.FC = () => {
  const { state, stats, selectGhost, setView, runAutoAllocation } = useBureau();

  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'new' | 'matched' | 'relocated' | 'problem'>('all');
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocationToast, setAllocationToast] = useState<string | null>(null);

  // Trigger auto allocation with clear visual feedback
  const handleAutoAllocate = () => {
    setIsAllocating(true);
    setTimeout(() => {
      runAutoAllocation();
      setIsAllocating(false);
      setAllocationToast(`✓ Подбор завершен: ${stats.relocatedCount} расселено, ${stats.unassignedCount} без места`);
      setTimeout(() => setAllocationToast(null), 3500);
    }, 400);
  };

  // Section 1: "Требуют внимания (4)"
  // Louise (overdue), Bartholomew (< 16h), Seraphima (< 24h), Edgar (close deadline or needs review)
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
      {/* Toast Notification */}
      {allocationToast && (
        <div className="fixed top-6 right-8 z-50 bg-[#162238] border border-blue-500/40 text-blue-200 px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2.5 text-xs animate-in slide-in-from-top duration-300">
          <Sparkles className="w-4 h-4 text-blue-400" />
          <span>{allocationToast}</span>
        </div>
      )}

      {/* 1. TOP HEADER BANNER (Greeting + Castle Silhouette + Tools) */}
      <div className="relative rounded-2xl bg-[#0e1320] border border-[#1b253b] p-6 overflow-hidden shadow-lg">
        <CastleHeaderBanner />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Title & Subtitle */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Добро пожаловать в бюро
              </h1>
              <span className="text-rose-400 text-lg">✨</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Здесь вы распределяете привидений по подходящим местам обитания
            </p>
          </div>

          {/* Right Controls: Search, Status Chips, User, Auto-allocation Button */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Поиск по имени, локации..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Chip 1: Available Slots */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-white">{stats.availableSlots}</span>
              <span className="text-slate-400">свободных мест</span>
            </div>

            {/* Chip 2: Needs Attention */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141b2c] border border-[#212d46] rounded-full text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">{stats.needsAttentionCount}</span>
              <span className="text-amber-300/80">требуют внимания</span>
            </div>

            {/* Auto-allocate Button */}
            <button
              onClick={handleAutoAllocate}
              disabled={isAllocating}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-xs font-semibold shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
              title="Запустить алгоритм автоматического расселения"
            >
              <Zap className={`w-3.5 h-3.5 ${isAllocating ? 'animate-spin' : ''}`} />
              <span>{isAllocating ? 'Подбор...' : 'Авто-подбор'}</span>
            </button>

            {/* Operator Avatar */}
            <div className="w-8 h-8 rounded-full bg-[#1e2a42] border border-[#2d3e61] flex items-center justify-center text-slate-300 shadow-inner">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. FIVE KPI STATS CARDS (Matching mockup row) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        {/* KPI 1: Всего заявок */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.totalGhosts}</div>
            <div className="text-xs text-slate-400 mt-1">Всего заявок</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#182338] border border-[#243350] flex items-center justify-center text-slate-300">
            <Home className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 2: Расселено */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.relocatedCount}</div>
            <div className="text-xs text-slate-400 mt-1">Расселено</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 3: Без места */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.unassignedCount}</div>
            <div className="text-xs text-slate-400 mt-1">Без места</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-950/40 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <XCircle className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 4: Требуют внимания */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold font-mono text-white tracking-tight">{stats.needsAttentionCount}</div>
            <div className="text-xs text-slate-400 mt-1">Требуют внимания</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        {/* KPI 5: Загруженность мест (With circular progress ring) */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-xl p-4 flex items-center justify-between">
          <ScoreRing
            score={stats.occupancyPercent}
            size={46}
            strokeWidth={4.5}
            colorClass="text-blue-500"
          />
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-200">Загруженность</div>
            <div className="text-[11px] text-slate-400 mt-0.5">мест ({stats.totalOccupied}/{stats.totalCapacity})</div>
          </div>
        </div>
      </div>

      {/* 3. SECTION 1: ТРЕБУЮТ ВНИМАНИЯ (4) */}
      <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-4 shadow-md">
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
            className="text-xs font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
          >
            <span>Все заявки</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
                className="py-3.5 flex items-center justify-between gap-4 group cursor-pointer hover:bg-[#141b2c]/60 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <GhostAvatar size="md" className="group-hover:scale-105 transition-transform" />
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

                  {/* Score */}
                  <div className="text-xs font-mono font-bold text-slate-200 min-w-[40px] text-right">
                    {evalScore ? `${evalScore}%` : '—'}
                  </div>

                  {/* Blue Action Button */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      selectGhost(ghost.id);
                    }}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow-blue-500/20"
                  >
                    Подобрать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SECTION 2: ЗАЯВКИ ПРИВИДЕНИЙ (10) */}
      <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-4 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <h2 className="text-sm font-bold text-white tracking-tight">Заявки привидений</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#182338] text-slate-300 border border-[#243350]">
              {state.ghosts.length}
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-[#0a0e17] p-1 rounded-xl border border-[#182338] text-xs">
            <button
              onClick={() => setTableFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tableFilter === 'all' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setTableFilter('new')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tableFilter === 'new' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Новые
            </button>
            <button
              onClick={() => setTableFilter('matched')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tableFilter === 'matched' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Подобрано
            </button>
            <button
              onClick={() => setTableFilter('relocated')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tableFilter === 'relocated' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Расселено
            </button>
            <button
              onClick={() => setTableFilter('problem')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                tableFilter === 'problem' ? 'bg-[#1b263b] text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Проблемные
            </button>
          </div>
        </div>

        {/* Table matching mockup */}
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
                    className="hover:bg-[#141c2c] cursor-pointer transition-colors"
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

      {/* 5. BOTTOM ROW: 3 CARDS (Загрузка мест, Статистика, Проблемные заявки) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Загрузка мест */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3.5 shadow-md">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Загрузка мест
          </h3>

          <div className="space-y-3 pt-1">
            {displayPlaces.map(place => {
              const occupants = state.allocation.placeOccupants[place.id] || [];
              const percent = Math.round((occupants.length / place.capacity) * 100);

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
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 2: Статистика */}
        <div className="bg-[#101625] border border-[#1b253b] rounded-2xl p-5 space-y-3.5 shadow-md flex flex-col justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Статистика
          </h3>

          <div className="flex items-center justify-between gap-4 py-2">
            {/* Donut Score */}
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
                <span className="font-bold font-mono text-slate-200">{anxietyCounts.high}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-400">Средняя тревожность</span>
                <span className="font-bold font-mono text-slate-200">{anxietyCounts.medium}</span>
              </div>
              <div className="flex items-center justify-end gap-2">
                <span className="text-slate-400">Низкая тревожность</span>
                <span className="font-bold font-mono text-slate-200">{anxietyCounts.low}</span>
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
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-medium text-slate-200">Луиза</span>
              </div>
              <span className="text-rose-400 text-[11px] font-medium">Просрочен дедлайн</span>
            </div>

            {/* 2. Bartholomew: Critical deadline */}
            <div
              onClick={() => selectGhost('ghost-5')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-slate-200">Варфоломей</span>
              </div>
              <span className="text-amber-400 text-[11px] font-medium">Критический дедлайн</span>
            </div>

            {/* 3. Seraphima: Low score or close deadline */}
            <div
              onClick={() => selectGhost('ghost-7')}
              className="flex items-center justify-between p-2 rounded-lg bg-[#141b2c] hover:bg-[#182338] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-medium text-slate-200">Серафима</span>
              </div>
              <span className="text-amber-400 text-[11px] font-medium">Низкий score (58%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
