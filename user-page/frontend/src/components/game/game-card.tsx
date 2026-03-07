'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Game } from '@/stores/game-store';
import { getProviderImage } from '@/lib/provider-images';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  compact?: boolean;
}

export function GameCard({ game, onPlay, compact }: GameCardProps) {
  const hue = game.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const logoSrc = getProviderImage(game.provider, game.providerName);
  const [imgError, setImgError] = useState(false);

  return (
    <button
      onClick={() => onPlay(game)}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[12px] bg-white border border-[#e8e8e8] transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#feb614]/40 text-left',
        compact ? 'w-[120px]' : 'w-full'
      )}
    >
      {/* Thumbnail */}
      <div
        className={cn(
          'relative w-full overflow-hidden flex items-center justify-center',
          compact ? 'h-[90px]' : 'aspect-[4/3]'
        )}
        style={{
          background: `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 70%, 35%))`,
        }}
      >
        {/* Provider logo as card visual */}
        {logoSrc && !imgError ? (
          <Image
            src={logoSrc}
            alt={game.providerName}
            width={compact ? 48 : 64}
            height={compact ? 48 : 64}
            className="object-contain drop-shadow-lg opacity-90"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-white/90 text-[11px] font-bold text-center px-2 leading-tight line-clamp-2">
            {game.name}
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded-full bg-[#feb614] px-4 py-1.5 text-[12px] font-bold text-[#252531]">
            Play
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={cn('flex flex-col px-2 py-2', compact ? 'items-center' : '')}>
        <span className="line-clamp-1 text-[11px] font-semibold text-[#252531]" title={game.name}>
          {game.name}
        </span>
        <span className="text-[10px] text-[#98a7b5] mt-0.5">{game.providerName}</span>
      </div>
    </button>
  );
}
