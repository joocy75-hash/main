'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GAME_CATEGORIES } from '@/lib/constants';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game, GameCategory } from '../../../../../shared/types/game';

const ALL_CATEGORY = { code: 'all' as const, name: '전체', icon: '🎰' };

export default function GamesPage() {
  return (
    <Suspense>
      <GamesContent />
    </Suspense>
  );
}

function GamesContent() {
  const {
    providers,
    games,
    selectedCategory,
    selectedProvider,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchProviders,
    fetchGames,
    loadMoreGames,
    searchGames,
    setSelectedCategory,
    setSelectedProvider,
    setSearchQuery,
  } = useGameStore();

  const { isAuthenticated } = useAuthStore();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') as GameCategory | null;

  const [searchInput, setSearchInput] = useState('');
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync URL category param to store
  useEffect(() => {
    const validCategories = GAME_CATEGORIES.map((c) => c.code as string);
    if (categoryParam && validCategories.includes(categoryParam)) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    fetchProviders();
    fetchGames();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when category changes
  useEffect(() => {
    fetchProviders(selectedCategory ?? undefined);
    fetchGames(selectedProvider ?? undefined);
  }, [selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when provider changes
  useEffect(() => {
    if (selectedProvider !== null) {
      fetchGames(selectedProvider);
    }
  }, [selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchQuery(value);
        if (value.trim()) {
          searchGames(value, selectedCategory ?? undefined);
        } else {
          fetchGames(selectedProvider ?? undefined);
        }
      }, 300);
    },
    [selectedCategory, selectedProvider, setSearchQuery, searchGames, fetchGames]
  );

  const handleCategorySelect = useCallback(
    (code: string) => {
      const category = code === 'all' ? null : (code as GameCategory);
      setSelectedCategory(category);
      setSearchInput('');
      setSearchQuery('');
    },
    [setSelectedCategory, setSearchQuery]
  );

  const handleProviderSelect = useCallback(
    (code: string) => {
      const provider = selectedProvider === code ? null : code;
      setSelectedProvider(provider);
    },
    [selectedProvider, setSelectedProvider]
  );

  const handlePlay = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  const handleDemo = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Category tabs */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {[ALL_CATEGORY, ...GAME_CATEGORIES].map((cat) => {
            const isActive =
              cat.code === 'all'
                ? selectedCategory === null
                : selectedCategory === cat.code;
            return (
              <button
                key={cat.code}
                onClick={() => handleCategorySelect(cat.code)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="게임 검색..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-10 bg-card pl-9"
        />
      </div>

      {/* Providers horizontal scroll */}
      {providers.length > 0 && (
        <div>
          <h3 className="mb-2.5 text-sm font-semibold text-muted-foreground">
            프로바이더
          </h3>
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderSelect(provider.code)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                    selectedProvider === provider.code
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-foreground hover:bg-secondary'
                  )}
                >
                  <span className="font-medium">{provider.name}</span>
                  <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground">
                    {provider.gameCount}
                  </span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Game grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
          게임 목록
          {games.length > 0 && (
            <span className="ml-1.5 text-xs font-normal">
              ({games.length}개)
            </span>
          )}
        </h3>

        {isLoading ? (
          <GameGridSkeleton />
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="text-4xl">🎮</span>
            <p className="text-sm text-muted-foreground">
              게임을 찾을 수 없습니다
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {games.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  isAuthenticated={isAuthenticated}
                  onPlay={handlePlay}
                  onDemo={handleDemo}
                />
              ))}
            </div>

            {/* Load more button */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={loadMoreGames}
                  disabled={isLoadingMore}
                  className="min-w-[200px]"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      로딩 중...
                    </>
                  ) : (
                    '더 보기'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Launch modal */}
      <GameLaunchModal
        game={selectedGame}
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
      />
    </div>
  );
}

const GameGridSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
    {Array.from({ length: 10 }).map((_, i) => (
      <div key={i} className="flex flex-col gap-2">
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    ))}
  </div>
);
