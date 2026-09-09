import type { EnvironmentData } from './environment.types';

/**
 * Fictional Sanctuary Reference Location
 * These coordinates are solely used for atmospheric simulation (moon & twilight).
 * They have ZERO relation or influence on ghost relocations.
 */
export const BUREAU_LOCATION = {
  name: 'Убежище Блэквуд',
  englishName: 'Blackwood Sanctuary',
  latitude: 56.4907,
  longitude: -4.2026,
  timezone: 'auto'
} as const;

export const OPEN_METEO_CONFIG = {
  baseUrl: 'https://api.open-meteo.com/v1/forecast',
  requestTimeoutMs: 4000,
  cacheKey: 'ghost_bureau_environment_v1',
  /** Cache validity: 6 hours (reduces network calls while keeping data fresh) */
  cacheTtlMs: 6 * 60 * 60 * 1000,
  attribution: {
    source: 'Open-Meteo',
    url: 'https://open-meteo.com/',
    note: 'Free API limits: up to 10,000 requests/day. Used for prototype/demo purposes.'
  }
} as const;

/**
 * Deterministic, offline fallback configuration.
 * Used if network is unavailable, times out, or when localStorage is empty.
 */
export const DEFAULT_ENVIRONMENT_FALLBACK: EnvironmentData = {
  locationName: BUREAU_LOCATION.name,
  moon: {
    fraction: 0.94,
    category: 'waning_crescent',
    label: 'Убывающий серп',
    illuminationPercent: 94,
    symbol: '🌘'
  },
  sun: {
    sunrise: '06:36',
    sunset: '19:51',
    moonrise: '03:57',
    moonset: '19:19',
    isNight: true
  },
  status: 'fallback',
  statusMessage: 'Автономный режим',
  lastUpdated: Date.now(),
  isCached: false,
  attribution: {
    source: OPEN_METEO_CONFIG.attribution.source,
    url: OPEN_METEO_CONFIG.attribution.url,
    note: OPEN_METEO_CONFIG.attribution.note
  }
};
