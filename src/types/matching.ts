export type FactorType = 'pro' | 'warning' | 'hard_conflict';

export type FactorCategory = 
  | 'temperature' 
  | 'lighting' 
  | 'noise' 
  | 'humidity' 
  | 'humans' 
  | 'capacity' 
  | 'special_requirements'
  | 'competition';

export interface MatchFactor {
  category: FactorCategory;
  type: FactorType;
  message: string;
  deltaScore?: number;
}

export interface PlaceMatchEvaluation {
  placeId: string;
  ghostId: string;
  score: number; // 0 to 100
  isEligible: boolean; // false если есть хотя бы 1 hard_conflict
  pros: MatchFactor[];
  warnings: MatchFactor[];
  hardConflicts: MatchFactor[];
  summary: string;
}

export interface GhostMatchResult {
  ghostId: string;
  recommendedPlaceId: string | null;
  evaluations: Record<string, PlaceMatchEvaluation>;
  status: import('./ghost').GhostStatus;
  displacementReason?: string;
  impossibleReasons?: string[];
}
