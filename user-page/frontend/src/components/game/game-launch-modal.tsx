'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Play, Monitor, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore } from '@/stores/game-store';
import type { Game } from '../../../../shared/types/game';

interface GameLaunchModalProps {
  game: Game | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatKRW = (amount: string | number) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('ko-KR').format(num);
};

const getPlatform = (): 1 | 2 => {
  if (typeof window === 'undefined') return 1;
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  )
    ? 2
    : 1;
};

export const GameLaunchModal = ({
  game,
  open,
  onOpenChange,
}: GameLaunchModalProps) => {
  const { user } = useAuthStore();
  const { launchGame, launchDemoGame } = useGameStore();
  const [isLaunching, setIsLaunching] = useState(false);
  const [isDemoLaunching, setIsDemoLaunching] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsLaunching(false);
      setIsDemoLaunching(false);
      setImageError(false);
    }
  }, [open]);

  const handleLaunch = useCallback(async () => {
    if (!game) return;
    setIsLaunching(true);
    try {
      const platform = getPlatform();
      const result = await launchGame(game.externalId, platform);
      if (result.url) {
        // Desktop: open new tab, Mobile: could do fullscreen iframe
        window.open(result.url, '_blank', 'noopener,noreferrer');
        onOpenChange(false);
      }
    } catch {
      // Error handled silently
    } finally {
      setIsLaunching(false);
    }
  }, [game, launchGame, onOpenChange]);

  const handleDemoLaunch = useCallback(async () => {
    if (!game) return;
    setIsDemoLaunching(true);
    try {
      const platform = getPlatform();
      const result = await launchDemoGame(game.externalId, platform);
      if (result.url) {
        window.open(result.url, '_blank', 'noopener,noreferrer');
        onOpenChange(false);
      }
    } catch {
      // Error handled silently
    } finally {
      setIsDemoLaunching(false);
    }
  }, [game, launchDemoGame, onOpenChange]);

  if (!game) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">{game.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {game.providerName}
          </DialogDescription>
        </DialogHeader>

        {/* Thumbnail */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          {game.thumbnail && !imageError ? (
            <Image
              src={game.thumbnail}
              alt={game.name}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/20 via-secondary to-accent/20">
              <Monitor className="size-12 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Balance display */}
        {user && (
          <div className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
            <span className="text-sm text-muted-foreground">보유 잔액</span>
            <span className="text-base font-bold">
              {formatKRW(user.balance)} 원
            </span>
          </div>
        )}

        <DialogFooter className="flex gap-2 sm:flex-col sm:space-x-0">
          {user && (
            <Button
              className="w-full gap-2"
              size="lg"
              onClick={handleLaunch}
              disabled={isLaunching || isDemoLaunching}
            >
              {isLaunching ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Play className="size-4" />
              )}
              게임 시작
            </Button>
          )}
          <Button
            variant="secondary"
            className="w-full gap-2"
            size="lg"
            onClick={handleDemoLaunch}
            disabled={isLaunching || isDemoLaunching}
          >
            {isDemoLaunching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Monitor className="size-4" />
            )}
            데모 플레이
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
