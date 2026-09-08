import type { GhostApplication } from '../types/ghost';

export const INITIAL_GHOSTS: GhostApplication[] = [
  {
    id: 'ghost-1',
    name: 'Агата',
    anxietyLevel: 'high',
    preferredTemperature: 'cool',
    deadlineHoursLeft: 72, // 3 дня
    specialRequirements: {
      requiresAttic: true,
      noMirrors: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Викторианская леди с обострённой чувствительностью к отражающим поверхностям. Ищет уединённый чердак.'
  },
  {
    id: 'ghost-2',
    name: 'Морок',
    anxietyLevel: 'medium',
    preferredTemperature: 'cold',
    deadlineHoursLeft: 120, // 5 дней
    specialRequirements: {
      likesDampness: true,
      isolatedFromHumans: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Теневой скиталец из болотных топей. Не переносит живых людей, предпочитает сырой холод.'
  },
  {
    id: 'ghost-3',
    name: 'Эдгар',
    anxietyLevel: 'low',
    preferredTemperature: 'moderate',
    deadlineHoursLeft: 168, // 7 дней
    specialRequirements: {
      prefersSilence: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Философ-меланхолик. Спокойный характер, главное требование — отсутствие резких звуков.'
  },
  {
    id: 'ghost-4',
    name: 'Луиза',
    anxietyLevel: 'high',
    preferredTemperature: 'cool',
    deadlineHoursLeft: -4, // Просрочен дедлайн!
    specialRequirements: {
      isolatedFromHumans: true,
    },
    status: 'needs_attention',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Заявка зависла в бюро. Крайне высокая тревожность, категорически запрещено соседство с людьми.'
  },
  {
    id: 'ghost-5',
    name: 'Варфоломей',
    anxietyLevel: 'high',
    preferredTemperature: 'freezing',
    deadlineHoursLeft: 16, // Срочно (< 24ч)
    specialRequirements: {
      requiresCellar: true,
      isolatedFromHumans: true,
      likesDampness: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Древний монах. Нуждается в глубоком морозном подвале без посторонних взглядов.'
  },
  {
    id: 'ghost-6',
    name: 'Касперский',
    anxietyLevel: 'low',
    preferredTemperature: 'warm',
    deadlineHoursLeft: 96, // 4 дня
    specialRequirements: {},
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Неприхотливое, дружелюбное привидение. Легко уживается в любых условиях, любит тепло.'
  },
  {
    id: 'ghost-7',
    name: 'Серафима',
    anxietyLevel: 'medium',
    preferredTemperature: 'moderate',
    deadlineHoursLeft: 22, // Срочно (< 24ч)
    specialRequirements: {
      noMirrors: true,
      prefersSilence: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Бывшая оперная певица. Требует покоя и отсутствия зеркал, чтобы не тревожить память.'
  },
  {
    id: 'ghost-8',
    name: 'Балтус',
    anxietyLevel: 'medium',
    preferredTemperature: 'cold',
    deadlineHoursLeft: 38, // Внимание (24-48ч)
    specialRequirements: {
      requiresAttic: true,
      likesDampness: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Старый шкипер. Мечтает о чердаке с видом на воду или сыром укрытии под крышей.'
  },
  {
    id: 'ghost-9',
    name: 'Тень без имени',
    anxietyLevel: 'high',
    preferredTemperature: 'freezing',
    deadlineHoursLeft: 10, // Срочно (< 24ч)
    specialRequirements: {
      requiresAttic: true,
      requiresCellar: true,
      isolatedFromHumans: true,
      noMirrors: true,
      prefersSilence: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Взаимоисключающий комплекс требований: нужен и чердак, и подвал одновременно, плюс полная тишина и отсутствие людей.'
  },
  {
    id: 'ghost-10',
    name: 'Оливия',
    anxietyLevel: 'low',
    preferredTemperature: 'cool',
    deadlineHoursLeft: 144, // 6 дней
    specialRequirements: {
      prefersSilence: true,
      likesDampness: true,
    },
    status: 'new',
    assignedPlaceId: null,
    manualOverride: false,
    bio: 'Тихая смотрительница садов. Не создает проблем, идеально подходит для тестирования мягких предпочтений.'
  }
];
