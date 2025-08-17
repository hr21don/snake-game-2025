'use client';

import { useRef, useEffect } from 'react';
import type { Player, AiOpponent } from '@/types';

interface ArenaProps {
  player: Player;
  aiOpponent: AiOpponent;
  arenaSize: number;
}

export function Arena({ player, aiOpponent, arenaSize }: ArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = canvas.width / arenaSize;

    // Clear canvas
    ctx.fillStyle = 'hsl(var(--background))';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(125, 249, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= arenaSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * scale, 0);
      ctx.lineTo(i * scale, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * scale);
      ctx.lineTo(canvas.width, i * scale);
      ctx.stroke();
    }
    
    const drawRider = (rider: Player | AiOpponent) => {
        if (!rider.isAlive && rider.trail.length === 0) return;

        if (rider === aiOpponent) {
          ctx.strokeStyle = "rgb(219, 6, 6)";
        } else {
          ctx.strokeStyle = "rgb(122, 253, 255, 0.8)";
        }
        ctx.lineWidth = scale * 0.9;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = rider.glowColor;
        ctx.shadowBlur = 15;
    
        const now = Date.now();
        const visibleTrail = rider.trail.filter(
            (positionWithTimestamp) => now - (positionWithTimestamp.timestamp || 0) < 5000
        );

        // Draw visible trail
        if (visibleTrail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(visibleTrail[0].x * scale + scale / 2, visibleTrail[0].y * scale + scale / 2);
            for (let i = 1; i < visibleTrail.length; i++) {
                ctx.lineTo(visibleTrail[i].x * scale + scale / 2, visibleTrail[i].y * scale + scale / 2);
            }
            ctx.stroke();
        }

        // Draw head
        if(rider.isAlive) {
            const head = rider.position;
            ctx.fillStyle = rider.color;
            ctx.beginPath();
            ctx.rect(head.x * scale, head.y * scale, scale, scale);
            ctx.fill();
            ctx.shadowBlur = 20;
            ctx.shadowColor = rider.glowColor;
            ctx.fillRect(head.x * scale, head.y * scale, scale, scale);
        }
    };

    drawRider(player);
    drawRider(aiOpponent);

    // Reset shadow for next draw cycle
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }, [player, aiOpponent, arenaSize]);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={800}
      className="rounded-lg border-2 border-primary/20 w-full h-full"
    />
  );
}
