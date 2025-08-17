export type Position = { x: number; y: number; timestamp?: number };

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Rider {
  id: string;
  position: Position;
  direction: Direction;
  trail: Position[];
  isAlive: boolean;
  color: string;
  glowColor: string;
}

export type Player = Rider;

export interface AiOpponent extends Rider {
  speed: number;
  aggressiveness: number;
}

export type GameState = 'idle' | 'running' | 'gameover';

export type GameSettings = {
  arenaSize: number;
  speed: number;
};

export type AiConfig = {
  speed: number;
  aggressiveness: number;
  description: string;
  strategyDescription: string;
};
