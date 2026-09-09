import type { GhostApplication } from '../types/ghost';
import type { GhostMatchResult } from '../types/matching';

/**
 * Категории статуса решения (Resolution Status)
 * Ортогонально срочности дедлайна.
 */
export type ResolutionStatus = 
  | 'unprocessed'        // Не обработано
  | 'assigned_auto'      // Расселено автоматически
  | 'assigned_manual'    // Расселено вручную
  | 'impossible';        // Невозможно

/**
 * Категории срочности (Urgency Level)
 * Ортогонально статусу расселения.
 */
export type UrgencyLevel = 
  | 'normal'     // Норма (> 24 ч.)
  | 'attention'  // Внимание (12–24 ч.)
  | 'urgent'     // Срочно (0–12 ч.)
  | 'expired';   // Просрочено (< 0 ч.)

/**
 * Определяет статус решения (Resolution) для сущности
 */
export function getResolutionStatus(
  ghost: GhostApplication,
  result?: GhostMatchResult
): ResolutionStatus {
  if (ghost.assignedPlaceId) {
    return ghost.manualOverride ? 'assigned_manual' : 'assigned_auto';
  }
  if (ghost.status === 'impossible' || result?.status === 'impossible') {
    return 'impossible';
  }
  return 'unprocessed';
}

/**
 * Определяет уровень срочности (Urgency) по остатку часов
 */
export function getUrgencyLevel(hoursLeft: number): UrgencyLevel {
  if (hoursLeft < 0) return 'expired';
  if (hoursLeft <= 12) return 'urgent';
  if (hoursLeft <= 24) return 'attention';
  return 'normal';
}

/**
 * Человекочитаемая текстовая метка статуса решения
 */
export function getResolutionLabel(status: ResolutionStatus): string {
  switch (status) {
    case 'assigned_auto':
      return 'Расселено автоматически';
    case 'assigned_manual':
      return 'Расселено вручную';
    case 'impossible':
      return 'Невозможно';
    case 'unprocessed':
    default:
      return 'Не обработано';
  }
}

/**
 * Человекочитаемая текстовая метка уровня срочности
 */
export function getUrgencyLabel(urgency: UrgencyLevel): string {
  switch (urgency) {
    case 'expired':
      return 'Просрочено';
    case 'urgent':
      return 'Срочно';
    case 'attention':
      return 'Внимание';
    case 'normal':
    default:
      return 'Норма';
  }
}

/**
 * Стилизованный бейдж для статуса решения
 */
export function getResolutionBadgeProps(status: ResolutionStatus): { label: string; className: string } {
  switch (status) {
    case 'assigned_auto':
      return {
        label: 'Расселено авто',
        className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      };
    case 'assigned_manual':
      return {
        label: 'Расселено вручную',
        className: 'bg-purple-500/15 text-purple-300 border-purple-500/30'
      };
    case 'impossible':
      return {
        label: 'Невозможно',
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
      };
    case 'unprocessed':
    default:
      return {
        label: 'Не обработано',
        className: 'bg-white/[0.08] text-[#D4D4D0] border-white/20'
      };
  }
}

/**
 * Стилизованный бейдж для уровня срочности
 */
export function getUrgencyBadgeProps(urgency: UrgencyLevel): { label: string; className: string } {
  switch (urgency) {
    case 'expired':
      return {
        label: 'Просрочено',
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold'
      };
    case 'urgent':
      return {
        label: 'Срочно (< 12ч)',
        className: 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-bold'
      };
    case 'attention':
      return {
        label: 'Внимание (< 24ч)',
        className: 'bg-amber-500/10 text-amber-200/90 border-amber-500/20'
      };
    case 'normal':
    default:
      return {
        label: 'Норма',
        className: 'bg-white/[0.04] text-[#7B7B78] border-white/[0.08]'
      };
  }
}

export interface AttentionInfo {
  needsAttention: boolean;
  why: string;
  actionLabel: string;
  isActionRequired: boolean; // true = требует выбора/изменения, false = уже расселено, только контроль
  badgeText: string;
  badgeBg: string;
}

/**
 * Комплексный расчет причины внимания (WHY ATTENTION) и унифицированного действия
 */
export function getAttentionInfo(
  ghost: GhostApplication,
  result?: GhostMatchResult
): AttentionInfo {
  const resolution = getResolutionStatus(ghost, result);
  const urgency = getUrgencyLevel(ghost.deadlineHoursLeft);

  // Случай 1: Невозможно расселить из-за несовместимости правил
  if (resolution === 'impossible') {
    return {
      needsAttention: true,
      why: 'Нет подходящей локации · жесткие ограничения',
      actionLabel: 'Проверить',
      isActionRequired: true,
      badgeText: 'Требует решения',
      badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    };
  }

  // Случай 2: Заявка не обработана (нет назначенного места)
  if (resolution === 'unprocessed') {
    return {
      needsAttention: true,
      why: 'Заявка не распределена',
      actionLabel: 'Проверить',
      isActionRequired: true,
      badgeText: 'Требует решения',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  }

  // Случай 3: Уже расселено, но просрочен дедлайн
  if (urgency === 'expired') {
    return {
      needsAttention: true,
      why: 'Расселено · требует контроля из-за просроченного дедлайна',
      actionLabel: 'Проверить',
      isActionRequired: false,
      badgeText: 'Расселено · требует контроля',
      badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
    };
  }

  // Случай 4: Уже расселено, но дедлайн срочный (< 12ч)
  if (urgency === 'urgent') {
    return {
      needsAttention: true,
      why: 'Расселено · требует контроля (дедлайн < 12 ч.)',
      actionLabel: 'Проверить',
      isActionRequired: false,
      badgeText: 'Расселено · требует контроля',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
    };
  }

  // Случай 5: Уже расселено, но дедлайн в зоне внимания (< 24ч)
  if (urgency === 'attention') {
    return {
      needsAttention: true,
      why: 'Расселено · требует контроля (дедлайн < 24 ч.)',
      actionLabel: 'Проверить',
      isActionRequired: false,
      badgeText: 'Расселено · требует контроля',
      badgeBg: 'bg-amber-500/10 text-amber-200/90 border-amber-500/20'
    };
  }

  // Заявка расселена в штатном режиме
  return {
    needsAttention: false,
    why: 'Расселено в штатном режиме',
    actionLabel: 'Проверить',
    isActionRequired: false,
    badgeText: 'В норме',
    badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  };
}

export interface DecisionStatusHeader {
  code: 'CONFIRMED' | 'REQUIRES_DECISION' | 'IMPOSSIBLE';
  label: string;
  badgeClass: string;
  description: string;
}

/**
 * Верхняя плашка для Инспектора сущности (Requirement 12)
 */
export function getInspectorDecisionHeader(
  ghost: GhostApplication,
  result?: GhostMatchResult
): DecisionStatusHeader {
  const resolution = getResolutionStatus(ghost, result);

  if (resolution === 'assigned_manual') {
    return {
      code: 'CONFIRMED',
      label: '✓ ПОДТВЕРЖДЕНО ОПЕРАТОРОМ',
      badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      description: 'Локация закреплена оператором в режиме ручного оверрайда'
    };
  }

  if (resolution === 'assigned_auto') {
    return {
      code: 'CONFIRMED',
      label: '✓ НАЗНАЧЕНО АЛГОРИТМОМ',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      description: 'Локация подобрана детерминированным алгоритмом бюро'
    };
  }

  if (resolution === 'impossible') {
    return {
      code: 'IMPOSSIBLE',
      label: '✕ НЕВОЗМОЖНО РАССЕЛИТЬ',
      badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      description: 'Ни одна из доступных локаций не удовлетворяет обязательным физическим условиям'
    };
  }

  return {
    code: 'REQUIRES_DECISION',
    label: '⚠ ТРЕБУЕТ РЕШЕНИЯ',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    description: 'Заявка ожидает выбора укрытия или подтверждения оператором'
  };
}
