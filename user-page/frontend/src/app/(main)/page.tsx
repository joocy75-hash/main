'use client';

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { Wallet, Gamepad2, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game } from '../../../../shared/types/game';

const QuickAction = ({
  icon: Icon,
  label,
  href,
  variant = 'secondary',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  variant?: 'default' | 'secondary';
}) => (
  <Button variant={variant} size="lg" className="flex-1 gap-2" asChild>
    <Link href={href}>
      <Icon className="size-5" />
      {label}
    </Link>
  </Button>
);

const GamePlaceholder = () => (
  <div className="flex flex-col gap-2">
    <Skeleton className="aspect-[4/3] w-full rounded-lg" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-1/2" />
  </div>
);

export default function MainLobbyPage() {
  const { popularGames, recentGames, fetchPopularGames, fetchRecentGames } =
    useGameStore();
  const { isAuthenticated } = useAuthStore();
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingRecent, setIsLoadingRecent] = useState(true);

  useEffect(() => {
    const loadPopular = async () => {
      setIsLoadingPopular(true);
      await fetchPopularGames();
      setIsLoadingPopular(false);
    };
    loadPopular();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      const loadRecent = async () => {
        setIsLoadingRecent(true);
        await fetchRecentGames();
        setIsLoadingRecent(false);
      };
      loadRecent();
    } else {
      setIsLoadingRecent(false);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  const handleDemo = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome message */}
      <div>
        <h1 className="text-2xl font-bold lg:text-3xl">
          환영합니다!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          오늘의 행운을 잡아보세요
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <QuickAction
          icon={Wallet}
          label="입금"
          href="/wallet/deposit"
          variant="default"
        />
        <QuickAction
          icon={Gamepad2}
          label="게임"
          href="/games"
        />
        <QuickAction
          icon={Gift}
          label="프로모션"
          href="/promotions"
        />
      </div>

      {/* Popular games section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">인기 게임</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/games">전체보기</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingPopular ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-[160px] shrink-0 sm:w-[180px]">
                    <GamePlaceholder />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : popularGames.length > 0 ? (
            <ScrollArea className="w-full">
              <div className="flex gap-4 pb-2">
                {popularGames.slice(0, 8).map((game) => (
                  <div key={game.id} className="w-[160px] shrink-0 sm:w-[180px]">
                    <GameCard
                      game={game}
                      isAuthenticated={isAuthenticated}
                      onPlay={handlePlay}
                      onDemo={handleDemo}
                    />
                  </div>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="text-2xl">🎮</span>
              <p className="text-sm text-muted-foreground">
                아직 인기 게임 데이터가 없습니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent plays section (only show if authenticated) */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">최근 플레이</CardTitle>
              <Button variant="link" size="sm" asChild>
                <Link href="/games">전체보기</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingRecent ? (
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="w-[160px] shrink-0 sm:w-[180px]">
                      <GamePlaceholder />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : recentGames.length > 0 ? (
              <ScrollArea className="w-full">
                <div className="flex gap-4 pb-2">
                  {recentGames.slice(0, 8).map((game) => (
                    <div key={game.id} className="w-[160px] shrink-0 sm:w-[180px]">
                      <GameCard
                        game={game}
                        isAuthenticated={isAuthenticated}
                        onPlay={handlePlay}
                        onDemo={handleDemo}
                      />
                    </div>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                <span className="text-2xl">🕹️</span>
                <p className="text-sm text-muted-foreground">
                  최근 플레이한 게임이 없습니다
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Launch modal */}
      <GameLaunchModal
        game={selectedGame}
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
      />
    </div>
  );
}
