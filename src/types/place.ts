export type LightingLevel = 'very_low' | 'low' | 'medium' | 'high';
export type NoiseLevel = 'silent' | 'low' | 'medium' | 'high';
export type HumidityLevel = 'low' | 'medium' | 'high';
export type HumanPresence = 'none' | 'rare' | 'sometimes' | 'frequent' | 'constant';

export interface RelocationPlace {
  id: string;
  name: string;
  type: string;
  capacity: number;
  lighting: LightingLevel;
  noiseLevel: NoiseLevel;
  humidity: HumidityLevel;
  humanPresence: HumanPresence;
  hasAttic: boolean;
  hasCellar: boolean;
  hasMirrors: boolean;
  description: string;
  tags?: string[];
}
