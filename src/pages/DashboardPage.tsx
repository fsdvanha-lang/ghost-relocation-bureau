import React, { useState, useMemo } from 'react';
import { 
  Check, 
  X,
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
import { GhostInspectorPanel } from '../components/ghosts/GhostInspectorPanel';

export const DashboardPage: React.FC = () => {
  const { 
    state, 
    stats, 
    selectedGhost,
    selectGhost, 
    assignManual,
    unassignGhost,
    setView, 
    runAutoAllocation,
    isAllocating,
    allocationStep,
    recentlyUpdatedGhostIds
  } = useBureau();

  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'new' | 'matched' | 'relocated' | 'problem'>('all');

  const selectedResult = selectedGhost ? state.allocation.ghostResults[selectedGhost.id] : null;

  // Trigger auto allocation with user feedback
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

  // Anxiety counts
  const anxietyCounts = useMemo(() => {
    let high = 0, medium = 0, low = 0;
    for (const g of state.ghosts) {
      if (g.anxietyLevel === 'high') high++;
      else if (g.anxietyLevel === 'medium') medium++;
      else low++;
    }
    return { high, medium, low };
  }, [state.ghosts]);

  // Key 4 places for "Загрузка мест" progress bars
  const displayPlaces = useMemo(() => {
    const targetIds = ['place-3', 'place-1', 'place-4', 'place-5'];
    return targetIds
      .map(id => state.places.find(p => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p);
  }, [state.places]);

  const anxietyBadges: Record<string, { label: string; bg: string; text: string }> = {
    high: { label: 'Высокая', bg: 'bg-[#291419] border-[#4c1d24]', text: 'text-rose-400' },
    medium: { label: 'Средняя', bg: 'bg-[#291f13] border-[#4d3617]', text: 'text-amber-400' },
    low: { label: 'Низкая', bg: 'bg-[#12281e] border-[#1b4332]', text: 'text-emerald-400' },
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
    <div className="flex flex-col xl:flex-row gap-6 items-start relative select-none">
      {/* =========================================================================
          LEFT / CENTER COLUMN (Dashboard Main)
          ========================================================================= */}
      <div className="flex-1 min-w-0 space-y-5 w-full">
        {/* 1. TOP HEADER BANNER with Painted Gothic Castle Background */}
        <div className="relative rounded-2xl bg-[#0e1424] border border-[#162035] p-5 lg:p-6 overflow-hidden shadow-lg animate-entrance-2">
          <CastleHeaderBanner />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Title and Subtitle matching reference */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                  Добро пожаловать в бюро
                </h1>
                <span className="text-[#f43f5e] text-lg select-none">✦</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Здесь вы распределяете привидений по подходящим местам обитания
              </p>
            </div>

            {/* Right Controls: Search, Status Chips, User Avatar, Auto-allocation */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Bar */}
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Поиск по имени, локации..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#111829]/90 border border-[#1d2943] rounded-full text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Free Slots Chip */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111829]/90 border border-[#1d2943] rounded-full text-xs text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <AnimatedNumber value={stats.availableSlots} className="font-bold text-white font-mono" />
                <span className="text-slate-400">свободных мест</span>
              </div>

              {/* Needs Attention Chip */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#111829]/90 border border-[#1d2943] rounded-full text-xs text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <AnimatedNumber value={stats.needsAttentionCount} className="font-bold font-mono" />
                <span className="text-amber-300/90">требуют внимания</span>
              </div>

              {/* Auto-allocation Button */}
              <button
                onClick={handleAutoAllocate}
                disabled={isAllocating}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-white rounded-full text-xs font-semibold shadow-md transition-all duration-200 ${
                  isAllocating
                    ? 'bg-amber-600'
                    : 'bg-[#3b66f5] hover:bg-[#4d75ff] shadow-[0_4px_12px_rgba(59,102,245,0.3)] hover:scale-[1.02] active:scale-[0.98]'
                }`}
                title="Запустить алгоритм оптимального подбора"
              >
                <Zap className={`w-3.5 h-3.5 ${isAllocating ? 'animate-spin' : ''}`} />
                <span>{isAllocating ? allocationStep || 'Подбор...' : 'Авто-подбор'}</span>
              </button>

              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-[#18233a] border border-[#263756] flex items-center justify-center text-slate-300">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. FIVE KPI STATS CARDS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 animate-entrance-3">
          {/* KPI 1: Всего заявок */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedNumber value={stats.totalGhosts} />
              </div>
              <div className="text-xs text-slate-400 mt-1">Всего заявок</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#151f33] border border-[#202e4b] flex items-center justify-center text-slate-300">
              <Home className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 2: Расселено */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedNumber value={stats.relocatedCount} />
              </div>
              <div className="text-xs text-slate-400 mt-1">Расселено</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#12281e] border border-[#1b4332] flex items-center justify-center text-emerald-400">
              <Check className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 3: Без места */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedNumber value={stats.unassignedCount} />
              </div>
              <div className="text-xs text-slate-400 mt-1">Без места</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#291419] border border-[#4c1d24] flex items-center justify-center text-rose-400">
              <X className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 4: Требуют внимания */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                <AnimatedNumber value={stats.needsAttentionCount} />
              </div>
              <div className="text-xs text-slate-400 mt-1">Требуют внимания</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-[#291f13] border border-[#4d3617] flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          {/* KPI 5: Загруженность мест */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-xl p-4 flex items-center justify-between shadow-sm">
            <ScoreRing
              score={stats.occupancyPercent}
              size={46}
              strokeWidth={4.5}
              colorClass="text-[#3b66f5]"
            />
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-200">Загруженность</div>
              <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                {stats.totalOccupied} из {stats.totalCapacity} мест
              </div>
            </div>
          </div>
        </div>

        {/* 3. SECTION 1: ТРЕБУЮТ ВНИМАНИЯ (4) */}
        <div className="bg-[#0e1424] border border-[#162035] rounded-2xl p-5 space-y-3 shadow-md animate-entrance-4">
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

          <div className="divide-y divide-[#151d2f]">
            {urgentGhosts.map(ghost => {
              const result = state.allocation.ghostResults[ghost.id];
              const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
              const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : 70;
              const anxietyStyle = anxietyBadges[ghost.anxietyLevel] || anxietyBadges.medium;
              const isOverdue = ghost.deadlineHoursLeft < 0;
              const isSelected = selectedGhost?.id === ghost.id;

              return (
                <div
                  key={ghost.id}
                  onClick={() => selectGhost(ghost.id)}
                  className={`py-3 flex items-center justify-between gap-4 group cursor-pointer px-3 rounded-xl transition-all duration-180 ${
                    isSelected ? 'bg-[#141d31] ring-1 ring-blue-500/40' : 'hover:bg-[#121929]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GhostAvatar size="md" ghostId={ghost.id} className="group-hover:scale-105 transition-transform duration-200" />
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
                        {ghost.id === 'ghost-4' 
                          ? 'Нужен чердак, нельзя рядом с людьми'
                          : ghost.id === 'ghost-5'
                          ? 'Критический дедлайн (< 16 ч.)'
                          : ghost.id === 'ghost-7'
                          ? 'Старая библиотека'
                          : ghost.id === 'ghost-3'
                          ? 'Любит тишину'
                          : ghost.bio?.split('.')[0] || 'Заявка на расселение'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 shrink-0">
                    {/* Deadline */}
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
                      className="px-3.5 py-1.5 bg-[#3b66f5] hover:bg-[#4d75ff] text-white rounded-lg text-xs font-semibold shadow-sm transition-all duration-180 hover:shadow-[0_2px_10px_rgba(59,102,245,0.4)] active:scale-95"
                    >
                      Подобрать
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. SECTION 2: ЗАЯВКИ ПРИВИДЕНИЙ (10) TABLE */}
        <div className="bg-[#0e1424] border border-[#162035] rounded-2xl p-5 space-y-4 shadow-md animate-entrance-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-bold text-white tracking-tight">Заявки привидений</h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#151f33] text-slate-300 border border-[#202e4b]">
                {state.ghosts.length}
              </span>
            </div>

            {/* Filter tabs */}
            <div className="flex items-center gap-1 bg-[#090d17] p-1 rounded-xl border border-[#151d2f] text-xs">
              <button
                onClick={() => setTableFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  tableFilter === 'all' ? 'bg-[#18233a] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setTableFilter('new')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  tableFilter === 'new' ? 'bg-[#18233a] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Новые
              </button>
              <button
                onClick={() => setTableFilter('matched')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  tableFilter === 'matched' ? 'bg-[#18233a] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Подобрано
              </button>
              <button
                onClick={() => setTableFilter('relocated')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  tableFilter === 'relocated' ? 'bg-[#18233a] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Расселено
              </button>
              <button
                onClick={() => setTableFilter('problem')}
                className={`px-3 py-1 rounded-lg transition-all duration-150 ${
                  tableFilter === 'problem' ? 'bg-[#18233a] text-white font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Проблемные
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#162035] text-slate-400 font-medium">
                  <th className="py-2.5 px-3 font-normal">Привидение</th>
                  <th className="py-2.5 px-3 font-normal">Тревожность</th>
                  <th className="py-2.5 px-3 font-normal">Температура</th>
                  <th className="py-2.5 px-3 font-normal">Дедлайн</th>
                  <th className="py-2.5 px-3 font-normal">Рекомендуемое место</th>
                  <th className="py-2.5 px-3 font-normal">Score</th>
                  <th className="py-2.5 px-3 font-normal">Статус</th>
                  <th className="py-2.5 px-3 font-normal text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#131b2e]">
                {filteredTableGhosts.map(ghost => {
                  const result = state.allocation.ghostResults[ghost.id];
                  const activePlaceId = ghost.assignedPlaceId || result?.recommendedPlaceId;
                  const activePlace = activePlaceId ? state.places.find(p => p.id === activePlaceId) : null;
                  const evalScore = activePlaceId && result?.evaluations ? result.evaluations[activePlaceId]?.score : undefined;
                  const anxietyStyle = anxietyBadges[ghost.anxietyLevel] || anxietyBadges.medium;
                  const isUpdated = recentlyUpdatedGhostIds.includes(ghost.id);
                  const isSelected = selectedGhost?.id === ghost.id;

                  let statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                      Новая
                    </span>
                  );
                  if (ghost.assignedPlaceId) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#12281e] text-[#22c55e] border border-[#1b4332]">
                        Подобрано
                      </span>
                    );
                  } else if (result?.status === 'impossible') {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#291419] text-rose-400 border border-[#4c1d24]">
                        Невозможно
                      </span>
                    );
                  } else if (ghost.deadlineHoursLeft <= 24) {
                    statusBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#291f13] text-amber-400 border border-[#4d3617]">
                        Требует решения
                      </span>
                    );
                  }

                  return (
                    <tr
                      key={ghost.id}
                      onClick={() => selectGhost(ghost.id)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected 
                          ? 'bg-[#141d31] font-medium' 
                          : 'hover:bg-[#121929]'
                      } ${isUpdated ? 'animate-row-update' : ''}`}
                    >
                      {/* Ghost Name + ID */}
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <GhostAvatar size="sm" ghostId={ghost.id} />
                          <div>
                            <span className="font-semibold text-slate-100">{ghost.name}</span>
                            <span className="text-[11px] text-slate-500 ml-1.5 font-mono">#{ghost.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Anxiety */}
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border ${anxietyStyle.bg} ${anxietyStyle.text}`}>
                          {anxietyStyle.label}
                        </span>
                      </td>

                      {/* Temperature */}
                      <td className="py-2.5 px-3 text-slate-300">
                        {tempLabels[ghost.preferredTemperature]}
                      </td>

                      {/* Deadline */}
                      <td className={`py-2.5 px-3 font-medium ${ghost.deadlineHoursLeft < 0 ? 'text-rose-400' : ghost.deadlineHoursLeft <= 24 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {formatDeadline(ghost.deadlineHoursLeft)}
                      </td>

                      {/* Recommended Place */}
                      <td className="py-2.5 px-3 text-slate-200 font-medium">
                        {activePlace ? activePlace.name : <span className="text-slate-600">—</span>}
                      </td>

                      {/* Score */}
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {evalScore !== undefined ? (
                          <span className={evalScore >= 80 ? 'text-emerald-400' : 'text-slate-300'}>
                            {evalScore}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3">{statusBadge}</td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            selectGhost(ghost.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#1a253a] transition-colors"
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

        {/* 5. BOTTOM ROW: 3 SUMMARY CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-entrance-6">
          {/* Card 1: Загрузка мест */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-2xl p-5 space-y-3.5 shadow-md">
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
                    <div className="w-full h-1.5 bg-[#141b2c] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 ease-out bg-[#3b66f5]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Статистика */}
          <div className="bg-[#0e1424] border border-[#162035] rounded-2xl p-5 space-y-3.5 shadow-md flex flex-col justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Статистика
            </h3>

            <div className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3">
                <ScoreRing
                  score={90}
                  size={54}
                  strokeWidth={5}
                  colorClass="text-[#3b66f5]"
                />
                <div>
                  <div className="text-xs font-bold text-white">Средний score</div>
                  <div className="text-[11px] text-slate-400">совместимости</div>
                </div>
              </div>

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
          <div className="bg-[#0e1424] border border-[#162035] rounded-2xl p-5 space-y-3.5 shadow-md">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Проблемные заявки
            </h3>

            <div className="space-y-2.5 pt-1 text-xs">
              <div
                onClick={() => selectGhost('ghost-4')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#121929] hover:bg-[#182238] cursor-pointer transition-colors duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-medium text-slate-200 group-hover:text-white transition-colors">Луиза</span>
                </div>
                <span className="text-rose-400 text-[11px] font-medium">Просрочен дедлайн</span>
              </div>

              <div
                onClick={() => selectGhost('ghost-5')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#121929] hover:bg-[#182238] cursor-pointer transition-colors duration-150 group"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-medium text-slate-200 group-hover:text-white transition-colors">Варфоломей</span>
                </div>
                <span className="text-amber-400 text-[11px] font-medium">Критический дедлайн</span>
              </div>

              <div
                onClick={() => selectGhost('ghost-7')}
                className="flex items-center justify-between p-2 rounded-lg bg-[#121929] hover:bg-[#182238] cursor-pointer transition-colors duration-150 group"
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

      {/* =========================================================================
          RIGHT COLUMN: DOCKED GHOST INSPECTOR PANEL (matching reference screenshot)
          ========================================================================= */}
      {selectedGhost && (
        <div className="hidden xl:block w-[410px] shrink-0 sticky top-4">
          <GhostInspectorPanel
            ghost={selectedGhost}
            places={state.places}
            evaluations={selectedResult?.evaluations || {}}
            placeOccupants={state.allocation.placeOccupants}
            recommendedPlaceId={selectedResult?.recommendedPlaceId || null}
            displacementReason={selectedResult?.displacementReason}
            impossibleReasons={selectedResult?.impossibleReasons}
            onClose={() => selectGhost(null)}
            onManualAssign={assignManual}
            onUnassign={unassignGhost}
            isDocked={true}
          />
        </div>
      )}
    </div>
  );
};
