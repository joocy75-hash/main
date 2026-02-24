'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Game } from '../../../../shared/types/game';

interface GameCardProps {
  game: Game;
  isAuthenticated: boolean;
  onPlay: (game: Game) => void;
  onDemo: (game: Game) => void;
  launchCount?: number;
}

export const GameCard = ({
  game,
  isAuthenticated,
  onPlay,
  onDemo,
  launchCount = 0,
}: GameCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPopular = launchCount > 1000;

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {game.thumbnail && !imageError ? (
          <Image
            src={game.thumbnail}
            alt={game.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary to-accent/20">
            <span className="text-3xl font-bold text-muted-foreground/50">
              {game.name.charAt(0)}
            </span>
          </div>
        )}

        {/* Popular badge */}
        {isPopular && (
          <Badge
            className="absolute left-1.5 top-1.5 bg-destructive text-white text-[10px] px-1.5 py-0.5"
          >
            HOT
          </Badge>
        )}

        {/* Hover overlay */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {isAuthenticated ? (
            <Button
              size="sm"
              className="gap-1.5"
              onClick={() => onPlay(game)}
            >
              <Play className="size-4" />
              플레이
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              className="gap-1.5"
              onClick={() => onDemo(game)}
            >
              <Eye className="size-4" />
              무료 체험
            </Button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="truncate text-sm font-medium">{game.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {game.providerName}
        </p>
      </div>
    </div>
  );
};
