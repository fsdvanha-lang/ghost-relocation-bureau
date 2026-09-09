/**
 * Domain types for the ambient environment layer.
 * Strictly decoupled from ghost matching logic.
 */

export type MoonPhaseCategory = 
  | 'new_moon'
  | 'waxing_crescent'
  | 'first_quarter'
  | 'waxing_gibbous'
  | 'full_moon'
  | 'waning_gibbous'
  | 'last_quarter'
  | 'waning_crescent';

export interface MoonPhaseInfo {
  /** Raw fraction of lunar cycle (0.0 - 1.0) */
  fraction: number;
  /** Categorical phase key */
  category: MoonPhaseCategory;
  /** Localized human-readable name in Russian */
  label: string;
  /** Calculated illumination percentage (0 - 100) */
  illuminationPercent: number;
  /** Unicode moon emoji or symbol */
  symbol: string;
}

export interface SunTimesInfo {
  /** ISO datetime or HH:mm string for sunrise */
  sunrise: string;
  /** ISO datetime or HH:mm string for sunset */
  sunset: string;
  /** Time of moonrise */
  moonrise: string;
  /** Time of moonset */
  moonset: string;
  /** Whether the current local time falls into night/twilight */
  isNight: boolean;
}

export type SyncStatus = 'syncing' | 'synced' | 'fallback';

export interface EnvironmentData {
  locationName: string;
  moon: MoonPhaseInfo;
  sun: SunTimesInfo;
  status: SyncStatus;
  statusMessage: string;
  lastUpdated: number;
  isCached: boolean;
  attribution: {
    source: string;
    url: string;
    note: string;
  };
}
