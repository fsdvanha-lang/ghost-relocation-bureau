export type AnxietyLevel = 'low' | 'medium' | 'high';

export type TemperaturePreference = 'freezing' | 'cold' | 'cool' | 'moderate' | 'warm';

export type DeadlineUrgency = 'normal' | 'attention' | 'urgent' | 'expired';

export interface GhostSpecialRequirements {
  /** Hard constraint: место должно быть без присутствия людей */
  isolatedFromHumans?: boolean;
  /** Hard constraint: в месте обязательно должен быть чердак */
  requiresAttic?: boolean;
  /** Hard constraint: в месте обязательно должен быть подвал */
  requiresCellar?: boolean;
  /** Hard constraint: в месте не должно быть зеркал */
  noMirrors?: boolean;
  /** Soft preference: привидение любит тишину */
  prefersSilence?: boolean;
  /** Soft preference: привидение любит сырость */
  likesDampness?: boolean;
  /** Soft preference: привидение предпочитает глубокую темноту */
  prefersDarkness?: boolean;
}

export type GhostStatus = 
  | 'new'                 // Новая заявка
  | 'assigned_auto'       // Автоматически подобрано и распределено
  | 'assigned_manual'     // Назначено вручную оператором
  | 'needs_attention'     // Требует внимания (срочный дедлайн или низкий скор)
  | 'impossible';         // Невозможно расселить (нет подходящих мест)

export interface GhostApplication {
  id: string;
  name: string;
  anxietyLevel: AnxietyLevel;
  preferredTemperature: TemperaturePreference;
  /** Оставшееся время до дедлайна в часах (отрицательное — дедлайн просрочен) */
  deadlineHoursLeft: number;
  specialRequirements: GhostSpecialRequirements;
  status: GhostStatus;
  assignedPlaceId: string | null;
  manualOverride: boolean;
  manualOverrideReason?: string;
  bio?: string;
}
