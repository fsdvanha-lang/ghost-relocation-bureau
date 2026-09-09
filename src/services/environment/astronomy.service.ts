import type { EnvironmentData, MoonPhaseCategory, MoonPhaseInfo, SunTimesInfo } from './environment.types';
import { BUREAU_LOCATION, OPEN_METEO_CONFIG, DEFAULT_ENVIRONMENT_FALLBACK } from './environment.config';

interface OpenMeteoDailyResponse {
  timezone?: string;
  daily?: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    moonrise: string[];
    moonset: string[];
    moon_phase: number[];
  };
  error?: boolean;
  reason?: string;
}

interface StoredCache {
  timestamp: number;
  data: EnvironmentData;
}

/**
 * Maps a lunar cycle fraction (0.0 - 1.0) to human-readable category, Russian label, and symbol.
 */
export function parseMoonPhase(fraction: number): MoonPhaseInfo {
  // Normalize fraction into [0, 1)
  const norm = ((fraction % 1) + 1) % 1;

  // Illumination percentage from cycle fraction: (1 - cos(2*pi*f)) / 2 * 100
  const illuminationPercent = Math.round(((1 - Math.cos(2 * Math.PI * norm)) / 2) * 100);

  let category: MoonPhaseCategory = 'new_moon';
  let label = 'Новолуние';
  let symbol = '🌑';

  if (norm < 0.03 || norm >= 0.97) {
    category = 'new_moon';
    label = 'Новолуние';
    symbol = '🌑';
  } else if (norm < 0.22) {
    category = 'waxing_crescent';
    label = 'Растущий серп';
    symbol = '🌒';
  } else if (norm <= 0.28) {
    category = 'first_quarter';
    label = 'Первая четверть';
    symbol = '🌓';
  } else if (norm < 0.47) {
    category = 'waxing_gibbous';
    label = 'Растущая луна';
    symbol = '🌔';
  } else if (norm <= 0.53) {
    category = 'full_moon';
    label = 'Полнолуние';
    symbol = '🌕';
  } else if (norm < 0.72) {
    category = 'waning_gibbous';
    label = 'Убывающая луна';
    symbol = '🌖';
  } else if (norm <= 0.78) {
    category = 'last_quarter';
    label = 'Последняя четверть';
    symbol = '🌗';
  } else {
    category = 'waning_crescent';
    label = 'Убывающий серп';
    symbol = '🌘';
  }

  return {
    fraction: norm,
    category,
    label,
    illuminationPercent,
    symbol
  };
}

/**
 * Format ISO datetime string (e.g. 2026-09-09T19:51) to compact time string HH:mm.
 */
function extractTime(isoString?: string): string {
  if (!isoString) return '--:--';
  if (isoString.includes('T')) {
    return isoString.split('T')[1].slice(0, 5);
  }
  return isoString;
}

/**
 * Safe localStorage wrapper with TTL validation.
 */
export function getCachedEnvironment(): EnvironmentData | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(OPEN_METEO_CONFIG.cacheKey);
    if (!raw) return null;
    const parsed: StoredCache = JSON.parse(raw);
    const age = Date.now() - parsed.timestamp;
    if (age < OPEN_METEO_CONFIG.cacheTtlMs) {
      return {
        ...parsed.data,
        isCached: true
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function saveCachedEnvironment(data: EnvironmentData): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const cachePayload: StoredCache = {
      timestamp: Date.now(),
      data: {
        ...data,
        isCached: true
      }
    };
    localStorage.setItem(OPEN_METEO_CONFIG.cacheKey, JSON.stringify(cachePayload));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetch live atmospheric data from Open-Meteo Astronomy API.
 * Never throws. On failure, returns last cached data or static fallback.
 */
export async function fetchAtmosphereData(forceRefresh = false): Promise<EnvironmentData> {
  // 1. Check valid cache unless forceRefresh requested
  if (!forceRefresh) {
    const cached = getCachedEnvironment();
    if (cached) {
      return {
        ...cached,
        status: 'synced',
        statusMessage: 'Синхронизировано'
      };
    }
  }

  // 2. Build Open-Meteo Astronomy request URL
  const queryParams = new URLSearchParams({
    latitude: BUREAU_LOCATION.latitude.toString(),
    longitude: BUREAU_LOCATION.longitude.toString(),
    daily: 'sunrise,sunset,moonrise,moonset,moon_phase',
    timezone: BUREAU_LOCATION.timezone
  });

  const url = `${OPEN_METEO_CONFIG.baseUrl}?${queryParams.toString()}`;

  // 3. Execute with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPEN_METEO_CONFIG.requestTimeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const json: OpenMeteoDailyResponse = await response.json();

    if (json.error || !json.daily || !json.daily.time || json.daily.time.length === 0) {
      throw new Error(json.reason || 'Invalid daily array in API response');
    }

    const todayIndex = 0;
    const rawMoonPhase = json.daily.moon_phase[todayIndex] ?? 0.94;
    const moon = parseMoonPhase(rawMoonPhase);

    const sunrise = extractTime(json.daily.sunrise[todayIndex]);
    const sunset = extractTime(json.daily.sunset[todayIndex]);
    const moonrise = extractTime(json.daily.moonrise[todayIndex]);
    const moonset = extractTime(json.daily.moonset[todayIndex]);

    const sun: SunTimesInfo = {
      sunrise,
      sunset,
      moonrise,
      moonset,
      isNight: true // Bureau is permanently operated in nocturnal/twilight state
    };

    const envData: EnvironmentData = {
      locationName: BUREAU_LOCATION.name,
      moon,
      sun,
      status: 'synced',
      statusMessage: 'Синхронизировано',
      lastUpdated: Date.now(),
      isCached: false,
      attribution: {
        source: OPEN_METEO_CONFIG.attribution.source,
        url: OPEN_METEO_CONFIG.attribution.url,
        note: OPEN_METEO_CONFIG.attribution.note
      }
    };

    // Cache successful response
    saveCachedEnvironment(envData);

    return envData;
  } catch {
    clearTimeout(timeoutId);

    // Fallback order: last cached data (even if expired) -> static DEFAULT_ENVIRONMENT_FALLBACK
    const lastCached = getCachedEnvironment();
    if (lastCached) {
      return {
        ...lastCached,
        status: 'fallback',
        statusMessage: 'Автономный режим (кэш)',
        lastUpdated: lastCached.lastUpdated || Date.now()
      };
    }

    return {
      ...DEFAULT_ENVIRONMENT_FALLBACK,
      lastUpdated: Date.now()
    };
  }
}
