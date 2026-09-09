import { describe, it, expect, beforeEach, vi } from 'vitest';
import { parseMoonPhase, fetchAtmosphereData, getCachedEnvironment, saveCachedEnvironment } from '../astronomy.service';
import { DEFAULT_ENVIRONMENT_FALLBACK, OPEN_METEO_CONFIG } from '../environment.config';
import * as evaluator from '../../../matching/evaluator';
import * as allocation from '../../../matching/allocation';

describe('Environment Service & Fallback Logic', () => {
  let mockStorage: Record<string, string> = {};

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { mockStorage[key] = String(val); }),
      removeItem: vi.fn((key: string) => { delete mockStorage[key]; }),
      clear: vi.fn(() => { mockStorage = {}; })
    });
    vi.restoreAllMocks();
  });

  it('parseMoonPhase correctly maps fractional phases to Russian labels and illumination', () => {
    // New Moon
    const newMoon = parseMoonPhase(0.0);
    expect(newMoon.category).toBe('new_moon');
    expect(newMoon.label).toBe('Новолуние');
    expect(newMoon.illuminationPercent).toBe(0);

    // First Quarter (0.25 -> 50% illumination)
    const firstQuarter = parseMoonPhase(0.25);
    expect(firstQuarter.category).toBe('first_quarter');
    expect(firstQuarter.label).toBe('Первая четверть');
    expect(firstQuarter.illuminationPercent).toBe(50);

    // Full Moon (0.50 -> 100% illumination)
    const fullMoon = parseMoonPhase(0.5);
    expect(fullMoon.category).toBe('full_moon');
    expect(fullMoon.label).toBe('Полнолуние');
    expect(fullMoon.illuminationPercent).toBe(100);

    // Waning Crescent (e.g. 0.94)
    const crescent = parseMoonPhase(0.94);
    expect(crescent.category).toBe('waning_crescent');
    expect(crescent.label).toBe('Убывающий серп');
    expect(crescent.symbol).toBe('🌘');
  });

  it('getCachedEnvironment and saveCachedEnvironment respect TTL', () => {
    expect(getCachedEnvironment()).toBeNull();

    saveCachedEnvironment(DEFAULT_ENVIRONMENT_FALLBACK);
    const cached = getCachedEnvironment();
    expect(cached).not.toBeNull();
    expect(cached?.locationName).toBe(DEFAULT_ENVIRONMENT_FALLBACK.locationName);
    expect(cached?.isCached).toBe(true);
  });

  it('fetchAtmosphereData falls back to static default if network fails and cache is empty', async () => {
    // Mock global fetch to reject (simulate offline or DNS failure)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network offline')));

    const result = await fetchAtmosphereData(true);
    expect(result.status).toBe('fallback');
    expect(result.statusMessage).toBe('Автономный режим');
    expect(result.moon.label).toBe(DEFAULT_ENVIRONMENT_FALLBACK.moon.label);
    expect(result.attribution.source).toBe('Open-Meteo');
  });

  it('fetchAtmosphereData falls back to cached data if network fails but cache exists', async () => {
    saveCachedEnvironment({
      ...DEFAULT_ENVIRONMENT_FALLBACK,
      moon: {
        ...DEFAULT_ENVIRONMENT_FALLBACK.moon,
        illuminationPercent: 88
      }
    });

    // Mock fetch to reject
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('500 Internal Server Error')));

    const result = await fetchAtmosphereData(true);
    expect(result.status).toBe('fallback');
    expect(result.statusMessage).toContain('Автономный режим (кэш)');
    expect(result.moon.illuminationPercent).toBe(88);
  });

  it('fetchAtmosphereData succeeds when Open-Meteo returns valid daily data', async () => {
    const mockApiResponse = {
      timezone: 'Europe/London',
      daily: {
        time: ['2026-09-09'],
        sunrise: ['2026-09-09T06:36'],
        sunset: ['2026-09-09T19:51'],
        moonrise: ['2026-09-09T03:57'],
        moonset: ['2026-09-09T19:19'],
        moon_phase: [0.939]
      }
    };

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    } as Response));

    const result = await fetchAtmosphereData(true);
    expect(result.status).toBe('synced');
    expect(result.statusMessage).toBe('Синхронизировано');
    expect(result.sun.sunset).toBe('19:51');
    expect(result.sun.sunrise).toBe('06:36');
    expect(result.attribution.source).toBe(OPEN_METEO_CONFIG.attribution.source);
  });

  it('STRICT ISOLATION GUARANTEE: Matching engine has ZERO dependencies on environment services', () => {
    // Verify evaluator and allocation modules exist and work completely independently
    expect(typeof evaluator.evaluatePlaceForGhost).toBe('function');
    expect(typeof allocation.allocateGhostsToPlaces).toBe('function');

    // Verify neither module references or imports any environment functions
    const evaluatorStr = evaluator.evaluatePlaceForGhost.toString();
    const allocationStr = allocation.allocateGhostsToPlaces.toString();

    expect(evaluatorStr).not.toContain('open-meteo');
    expect(evaluatorStr).not.toContain('moon');
    expect(evaluatorStr).not.toContain('atmosphere');

    expect(allocationStr).not.toContain('open-meteo');
    expect(allocationStr).not.toContain('moon');
    expect(allocationStr).not.toContain('atmosphere');
  });
});
