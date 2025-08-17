'use client';

import React, { useRef } from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Arena } from '@/components/game/arena';
import { useGameEngine } from '@/hooks/use-game-engine';
import { GameControls } from '@/components/game/game-controls';
import type { AiConfig, GameSettings } from '@/types';
import { Separator } from '@/components/ui/separator';
import { Trophy, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge'

const ARENA_SIZE = 40;
const INITIAL_SPEED = 5;

const INITIAL_AI_CONFIG: AiConfig = {
  speed: 0.4,
  aggressiveness: 0.5,
  description: 'A balanced opponent of medium difficulty.',
  strategyDescription: 'A balanced opponent of medium difficulty.',
};

export default function HomePage() {
  const [gameSettings, setGameSettings] = useState<GameSettings>({
    arenaSize: ARENA_SIZE,
    speed: INITIAL_SPEED,
  });
  const [aiConfig, setAiConfig] = useState<AiConfig>(INITIAL_AI_CONFIG);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);

  const { gameState, player, aiOpponent, winner, score, startGame, resetGame, setPlayerDirection } =
    useGameEngine({ gameSettings, aiConfig });

  const handleReset = useCallback(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (gameState === 'running') {
          setPlayerDirection(e.key.replace('Arrow', '').toUpperCase() as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setPlayerDirection, gameState]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) audioRef.current.volume = newVolume;
  };
  const gameStatusBadge = useMemo(() => {
    switch (gameState) {
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'gameover':
        return <Badge variant="destructive">Game Over</Badge>;
      case 'idle':
      default:
        return <Badge>Idle</Badge>;
    }
  }, [gameState]);

  return (
    <div className="relative min-h-screen bg-background font-body">
      <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
        <Button onClick={togglePlayPause} size="icon" variant="outline">
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          )}
        </Button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="w-24 accent-primary"
        />
        <audio ref={audioRef} src="/music/Walen-Night-Drive.mp3" loop />
      </div>
    <main className="flex flex-col lg:flex-row h-screen w-screen items-center justify-center p-4 sm:p-6 md:p-8 bg-background font-body gap-8">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl md:text-6xl font-bold text-primary tracking-widest uppercase" style={{ textShadow: '0 0 10px hsl(var(--primary))' }}>
          Snake Game
        </h1>
        <div className="relative w-full max-w-[calc(100vw-2rem)] md:max-w-2xl lg:max-w-3xl xl:max-w-4xl aspect-square">
          <Arena player={player} aiOpponent={aiOpponent} arenaSize={gameSettings.arenaSize} />
          {gameState === 'gameover' && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
              <h2 className="text-5xl font-bold text-destructive animate-pulse">GAME OVER</h2>
              {winner && <p className="text-2xl mt-4 text-primary">{winner === 'player' ? 'You Win!' : 'AI Wins!'}</p>}
              <Button onClick={handleReset} className="mt-8" size="lg">Play Again</Button>
            </div>
          )}
        </div>
      </div>
      <Card className="w-full max-w-sm border-primary/20 shadow-lg shadow-primary/10">
        <CardHeader>
          <CardTitle className="text-primary flex items-center justify-between">
            Game Dashboard {gameStatusBadge}
          </CardTitle>
          <CardDescription>Configure your ride and outsmart the AI.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex justify-around text-center">
            <div className="flex flex-col items-center gap-1">
              <Trophy className="w-8 h-8 text-primary" />
              <p className="text-2xl font-bold">{score.player}</p>
              <p className="text-sm text-muted-foreground">Your Score</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Bot className="w-8 h-8 text-accent" />
              <p className="text-2xl font-bold">{score.ai}</p>
              <p className="text-sm text-muted-foreground">AI Score</p>
            </div>
          </div>
          <Separator />
          <GameControls
            gameSettings={gameSettings}
            setGameSettings={setGameSettings}
            aiConfig={aiConfig}
            setAiConfig={setAiConfig}
            isGameRunning={gameState === 'running'}
          />
          <Separator />
          <div className="flex gap-4">
            <Button onClick={startGame} disabled={gameState === 'running'} className="w-full">
              Start Game
            </Button>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Reset
            </Button>
          </div>
          <Separator />
          <div className="flex flex-col gap-4">
            <h1 className="font-bold">Instructions</h1>
            <p>Use the Arrow Keys to move your snake around the canvas.</p>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  )
}
