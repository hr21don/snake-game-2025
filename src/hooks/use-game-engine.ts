'use client';

import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import type { GameState, Player, AiOpponent, Direction, GameSettings, AiConfig, Position } from '@/types';

interface UseGameEngineProps {
  gameSettings: GameSettings;
  aiConfig: AiConfig;
}

type GameStateObject = {
  gameState: GameState;
  player: Player;
  aiOpponent: AiOpponent;
  winner: 'player' | 'ai' | null;
  score: { player: number; ai: number };
};

type Action = 
  | { type: 'START_GAME'; payload: { player: Player; aiOpponent: AiOpponent } }
  | { type: 'GAME_OVER'; payload: { winner: 'player' | 'ai'; score: { player: number; ai: number } } }
  | { type: 'UPDATE_RIDERS'; payload: { player: Player; aiOpponent: AiOpponent } }
  | { type: 'SET_PLAYER_DIRECTION'; payload: Direction }
  | { type: 'RESET'; payload: { player: Player; aiOpponent: AiOpponent; score: { player: number; ai: number } } };

const PLAYER_COLOR = 'hsl(var(--primary))';
const PLAYER_GLOW_COLOR = 'hsl(var(--primary))';
const AI_COLOR = 'hsl(var(--accent))';
const AI_GLOW_COLOR = 'hsl(var(--accent))';


const createInitialState = (arenaSize: number, score: {player: number, ai: number}): GameStateObject => {
  const initialPlayerPos = { x: Math.floor(arenaSize / 4), y: Math.floor(arenaSize / 2) };
  const initialAiPos = { x: Math.floor(arenaSize * 3 / 4), y: Math.floor(arenaSize / 2) };

  return {
    gameState: 'idle',
    player: {
      id: 'player',
      position: initialPlayerPos,
      direction: 'RIGHT',
      trail: [],
      isAlive: true,
      color: PLAYER_COLOR,
      glowColor: PLAYER_GLOW_COLOR,
    },
    aiOpponent: {
      id: 'ai',
      position: initialAiPos,
      direction: 'LEFT',
      trail: [],
      isAlive: true,
      color: AI_COLOR,
      glowColor: AI_GLOW_COLOR,
      speed: 0.5,
      aggressiveness: 0.5,
    },
    winner: null,
    score: score,
  };
};

function gameReducer(state: GameStateObject, action: Action): GameStateObject {
  switch (action.type) {
    case 'START_GAME':
      return { ...state, gameState: 'running', player: action.payload.player, aiOpponent: action.payload.aiOpponent, winner: null };
    case 'GAME_OVER':
      return { ...state, gameState: 'gameover', winner: action.payload.winner, score: action.payload.score };
    case 'UPDATE_RIDERS':
      return { ...state, player: action.payload.player, aiOpponent: action.payload.aiOpponent };
    case 'SET_PLAYER_DIRECTION':
      // Prevent 180 degree turns
      const oppositeDirections = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };
      if (state.player.direction === oppositeDirections[action.payload]) {
        return state;
      }
      return { ...state, player: { ...state.player, direction: action.payload } };
    case 'RESET':
      return { ...createInitialState(state.player.position.y * 2, action.payload.score), score: action.payload.score };
    default:
      return state;
  }
}

export function useGameEngine({ gameSettings, aiConfig }: UseGameEngineProps) {
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [state, dispatch] = useReducer(gameReducer, createInitialState(gameSettings.arenaSize, score));

  const animationFrameId = useRef<number>();
  const gameTickCounter = useRef<number>(0);
  const aiDecisionCounter = useRef<number>(0);

  const moveRider = (rider: Player | AiOpponent) => {
    const newPos = { ...rider.position };
    switch (rider.direction) {
      case 'UP': newPos.y--; break;
      case 'DOWN': newPos.y++; break;
      case 'LEFT': newPos.x--; break;
      case 'RIGHT': newPos.x++; break;
    }
    return { ...rider, position: newPos, trail: [...rider.trail, { ...rider.position, timestamp: Date.now() }] };
  };

  const checkCollision = (rider: Player | AiOpponent, otherRider: Player | AiOpponent, arenaSize: number) => {
    const head = rider.position;
    // Wall collision
    if (head.x < 0 || head.x >= arenaSize || head.y < 0 || head.y >= arenaSize) {
      return true;
    }

    const now = Date.now();
    const recentRiderTrail = rider.trail.filter(p => (now - p.timestamp) < 5000);
    const recentOtherRiderTrail = otherRider.trail.filter(p => (now - p.timestamp) < 5000);

    // Self and other rider trail collision
    const allTrails = new Set([
 ...recentRiderTrail.map(p => `${p.x},${p.y}`),
 ...recentOtherRiderTrail.map(p => `${p.x},${p.y}`),
        // include other rider's head if they are alive
        ...(otherRider.isAlive ? [`${otherRider.position.x},${otherRider.position.y}`] : [])
    ]);

    return allTrails.has(`${head.x},${head.y}`);
  };

  const getAiDirection = useCallback((ai: AiOpponent, player: Player, arenaSize: number, allTrails: Set<string>): Direction => {
    const { position, direction, aggressiveness } = ai;
    const directions: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
    const oppositeDirections: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT' };

    const isSafe = (pos: Position) => {
        return pos.x >= 0 && pos.x < arenaSize && pos.y >= 0 && pos.y < arenaSize && !allTrails.has(`${pos.x},${pos.y}`);
    }

    // Simple AI logic: try to keep going straight. If obstacle, turn.
    // Aggressiveness could mean turning towards player more often.
    aiDecisionCounter.current++;
    if (aiDecisionCounter.current < 10 / aiConfig.speed) {
        // Continue straight if possible
        let nextPos = { ...position };
        switch(direction) {
            case 'UP': nextPos.y--; break;
            case 'DOWN': nextPos.y++; break;
            case 'LEFT': nextPos.x--; break;
            case 'RIGHT': nextPos.x++; break;
        }
        if (isSafe(nextPos)) return direction;
    }
    aiDecisionCounter.current = 0; // Time for a new decision
    
    // Find valid turns (not reversing)
    const validTurns = directions.filter(d => d !== oppositeDirections[direction]);
    const safeTurns = validTurns.filter(d => {
        let nextPos = { ...position };
        switch(d) {
            case 'UP': nextPos.y--; break;
            case 'DOWN': nextPos.y++; break;
            case 'LEFT': nextPos.x--; break;
            case 'RIGHT': nextPos.x++; break;
        }
        return isSafe(nextPos);
    });

    if (safeTurns.length === 0) {
        // No safe turn, just continue and crash
        return direction;
    }

    // With some probability based on aggressiveness, turn towards player
    if (Math.random() < aggressiveness) {
        const dx = player.position.x - position.x;
        const dy = player.position.y - position.y;
        
        let preferredTurns: Direction[] = [];
        if (Math.abs(dx) > Math.abs(dy)) {
            preferredTurns = dx > 0 ? ['RIGHT', 'LEFT'] : ['LEFT', 'RIGHT'];
        } else {
            preferredTurns = dy > 0 ? ['DOWN', 'UP'] : ['UP', 'DOWN'];
        }
        
        for (const turn of preferredTurns) {
            if(safeTurns.includes(turn)) return turn;
        }
    }

    return safeTurns[Math.floor(Math.random() * safeTurns.length)];
  }, [aiConfig.speed]);

  const gameLoop = useCallback(() => {
    if (state.gameState !== 'running') return;
  
    gameTickCounter.current++;
    if (gameTickCounter.current < (11 - gameSettings.speed)) {
      animationFrameId.current = requestAnimationFrame(gameLoop);
      return;
    }
    gameTickCounter.current = 0;
  
    let nextPlayer = { ...state.player };
    let nextAi = { ...state.aiOpponent, ...aiConfig };
  
    // AI decision making
    const now = Date.now();
    const recentPlayerTrail = state.player.trail.filter(p => (now - p.timestamp) < 5000);
    const recentAiTrail = state.aiOpponent.trail.filter(p => (now - p.timestamp) < 5000);
    const allTrailsForAI = new Set([
 ...recentPlayerTrail.map(p => `${p.x},${p.y}`),
 ...recentAiTrail.map(p => `${p.x},${p.y}`)
    ]);
    const aiNewDirection = getAiDirection(nextAi, nextPlayer, gameSettings.arenaSize, allTrailsForAI);
    nextAi.direction = aiNewDirection;

    // Move riders
    nextPlayer = moveRider(nextPlayer);
    nextAi = moveRider(nextAi);
  
    // Collision detection
    const playerCrashed = checkCollision(nextPlayer, nextAi, gameSettings.arenaSize);
    const aiCrashed = checkCollision(nextAi, nextPlayer, gameSettings.arenaSize);
  
    if (playerCrashed && aiCrashed) {
      // Tie
      nextPlayer.isAlive = false;
      nextAi.isAlive = false;
      dispatch({ type: 'GAME_OVER', payload: { winner: null, score } });
    } else if (playerCrashed) {
      nextPlayer.isAlive = false;
      const newScore = { ...score, ai: score.ai + 1 };
      setScore(newScore);
      dispatch({ type: 'GAME_OVER', payload: { winner: 'ai', score: newScore } });
    } else if (aiCrashed) {
      nextAi.isAlive = false;
      const newScore = { ...score, player: score.player + 1 };
      setScore(newScore);
      dispatch({ type: 'GAME_OVER', payload: { winner: 'player', score: newScore } });
    }
  
    dispatch({ type: 'UPDATE_RIDERS', payload: { player: nextPlayer, aiOpponent: nextAi } });
  
    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [state.gameState, state.player, state.aiOpponent, gameSettings, aiConfig, score, getAiDirection]);

  useEffect(() => {
    if (state.gameState === 'running') {
      animationFrameId.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [state.gameState, gameLoop]);

  const startGame = useCallback(() => {
    const { player, aiOpponent } = createInitialState(gameSettings.arenaSize, score);
    dispatch({ type: 'START_GAME', payload: { player, aiOpponent: {...aiOpponent, ...aiConfig } } });
  }, [gameSettings.arenaSize, score, aiConfig]);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET', payload: { ...createInitialState(gameSettings.arenaSize, score) } });
  }, [gameSettings.arenaSize, score]);

  const setPlayerDirection = useCallback((direction: Direction) => {
    if (state.gameState === 'running') {
      dispatch({ type: 'SET_PLAYER_DIRECTION', payload: direction });
    }
  }, [state.gameState]);

  return { ...state, startGame, resetGame, setPlayerDirection };
}
