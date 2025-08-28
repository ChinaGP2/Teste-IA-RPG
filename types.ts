
export interface Character {
  playerId: string;
  name: string;
  class: string;
  backstory: string;
  hp: number;
  maxHp: number;
}

export interface MapLocation {
  x: number;
  y: number;
  location_name: string;
  icon: string;
}

export interface GameMap {
  locations: MapLocation[];
  currentPosition: { x: number; y: number };
}

export interface StoryChoice {
  text: string;
}

export interface HealthChange {
  character_name: string;
  change: number;
}

export interface StoryUpdate {
  text: string;
  image_prompt: string;
  choices: StoryChoice[];
  found_items?: string[];
  health_changes?: HealthChange[];
  map_update?: MapLocation;
  story_summary: string;
}

export interface GameState {
  hostId: string;
  status: 'setup' | 'lobby' | 'solo_character_creation' | 'playing';
  isSolo: boolean;
  players: { [key: string]: string };
  characters: Character[];
  theme: string;
  generatedClasses: string[];
  inventory: string[];
  storySummary: string;
  map: GameMap;
  activeCharacterIndex: number;
  lastUpdate: StoryUpdate | null;
  playerLimit: number;
}

export type Screen = 'entry' | 'join' | 'setup' | 'character_creation' | 'lobby' | 'game';
