'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { Game } from '@/stores/game-store';
import { getProviderImage } from '@/lib/provider-images';

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
  compact?: boolean;
}

export const GameCard = memo(function GameCard({ game, onPlay, compact }: GameCardProps) {
  const hue = game.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  const logoSrc = getProviderImage(game.provider, game.providerName);
  const [gameImgError, setGameImgError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const hasGameImage = game.image && !gameImgError;
  const hasLogo = logoSrc && !logoError;

  return (
    <button
      onClick={() => onPlay(game)}
      className={cn(
        'group relative flex flex-col bg-white border border-[#e2e8f0] transition-all hover:-translate-y-1.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.08),_inset_0_2px_0_rgba(255,255,255,0.8)] hover:border-[#cbd5e1] text-left rounded-2xl overflow-hidden',
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
          background: hasGameImage
            ? '#1a1a2e'
            : `linear-gradient(135deg, hsl(${hue}, 60%, 45%), hsl(${(hue + 40) % 360}, 70%, 35%))`,
        }}
      >
        {hasGameImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={game.image}
            alt={game.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setGameImgError(true)}
          />
        ) : hasLogo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Image
              src={logoSrc}
              alt={game.providerName}
              width={compact ? 48 : 64}
              height={compact ? 48 : 64}
              className="object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] opacity-95"
              loading="lazy"
              onError={() => setLogoError(true)}
            />
          </div>
        ) : (
          <span className="text-white/90 text-[11px] font-bold text-center px-2 leading-tight line-clamp-2">
            {game.name}
          </span>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="rounded-full bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] px-5 py-2 text-[13px] font-black text-white shadow-[0_4px_8px_rgba(30,106,219,0.4),_inset_0_2px_0_rgba(255,255,255,0.3)] transform scale-90 group-hover:scale-100 transition-transform duration-300">
            PLAY
          </span>
        </div>
      </div>

      {/* Info */}
      <div className={cn('flex flex-col px-3 py-2.5 bg-gradient-to-b from-white to-[#f8fafc]', compact ? 'items-center' : '')}>
        <span className="line-clamp-1 text-[13px] font-black text-[#1e293b] tracking-tight" title={game.name}>
          {game.name}
        </span>
        <span className="text-[11px] font-bold text-[#94a3b8] mt-0.5 tracking-tight">{game.providerName}</span>
      </div>
    </button>
  );
});
