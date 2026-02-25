'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Search,
  Loader2,
  SlidersHorizontal,
  Heart,
  ChevronLeft,
  ChevronRight,
  Play,
  Eye,
} from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { GAME_CATEGORIES } from '@/lib/constants';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game, GameCategory } from '../../../../../shared/types/game';

// ──────────────────── Sub-category maps ────────────────────

const SUB_CATEGORIES: Record<string, { label: string; icon: string }[]> = {
  casino: [
    { label: 'All Games', icon: '🎰' },
    { label: 'Baccarat', icon: '🃏' },
    { label: 'Blackjack', icon: '🂡' },
    { label: 'Roulette', icon: '🎡' },
    { label: 'Recommend', icon: '🔥' },
  ],
  slot: [
    { label: 'All Games', icon: '🎲' },
    { label: 'Popular', icon: '🔥' },
    { label: 'New', icon: '✨' },
    { label: 'Jackpot', icon: '💰' },
    { label: 'Feature Buy', icon: '🎁' },
  ],
  holdem: [
    { label: 'All Games', icon: '🃏' },
    { label: 'Texas', icon: '🤠' },
    { label: 'Omaha', icon: '🎯' },
  ],
  sports: [
    { label: 'All Games', icon: '⚽' },
    { label: 'Football', icon: '⚽' },
    { label: 'Basketball', icon: '🏀' },
    { label: 'Tennis', icon: '🎾' },
  ],
  esports: [
    { label: 'All Games', icon: '🎮' },
    { label: 'CS2', icon: '🔫' },
    { label: 'LoL', icon: '⚔️' },
    { label: 'Dota 2', icon: '🛡️' },
  ],
  shooting: [
    { label: 'All Games', icon: '🎯' },
    { label: 'Fishing', icon: '🐟' },
    { label: 'Arcade', icon: '👾' },
  ],
  coin: [
    { label: 'All Games', icon: '🪙' },
  ],
  mini_game: [
    { label: 'All Games', icon: '🎮' },
    { label: 'Crash', icon: '📈' },
    { label: 'Dice', icon: '🎲' },
    { label: 'Mines', icon: '💣' },
  ],
};

const DEFAULT_SUBS = [{ label: 'All Games', icon: '🎰' }];

// ──────────────────── Banner data ────────────────────

const BANNERS = [
  { gradient: 'from-amber-500/20 to-yellow-500/10', text: 'Hot Games' },
  { gradient: 'from-purple-500/20 to-fuchsia-500/10', text: 'New Releases' },
  { gradient: 'from-emerald-500/20 to-green-500/10', text: 'Top Providers' },
];

// ──────────────────── Component ────────────────────

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
    totalGames,
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
  const [selectedSubCategory, setSelectedSubCategory] = useState('All Games');
  const [showFavourites, setShowFavourites] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerScrollRef = useRef<HTMLDivElement>(null);

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
    setSelectedSubCategory('All Games');
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

  const scrollProviders = (direction: 'left' | 'right') => {
    if (providerScrollRef.current) {
      const amount = direction === 'left' ? -200 : 200;
      providerScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const currentCategory = selectedCategory ?? 'casino';
  const subCategories = SUB_CATEGORIES[currentCategory] ?? DEFAULT_SUBS;
  const categoryInfo = GAME_CATEGORIES.find((c) => c.code === currentCategory);

  return (
    <div className="flex flex-col gap-0">
      {/* ── Banner Carousel ── */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {BANNERS.map((b, i) => (
          <div
            key={i}
            className={cn(
              'flex h-14 items-center justify-center rounded-lg bg-gradient-to-r',
              b.gradient,
              'border border-[#dddddd]/50'
            )}
          >
            <span className="text-sm font-medium text-[#707070]">{b.text}</span>
          </div>
        ))}
      </div>

      {/* ── Search Bar (full-width, kzkzb style) ── */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#707070]" />
        <input
          type="text"
          placeholder="Search your game"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-12 w-full rounded-xl border border-[#dddddd] bg-white pl-12 text-base text-[#252531] placeholder:text-[#707070]/50 focus:border-[#f4b53e] focus:outline-none"
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-[#707070]">
          <SlidersHorizontal className="size-4" />
          <span className="font-medium">Filter By</span>
        </div>

        {/* Category selector (main categories) */}
        <ScrollArea className="flex-1">
          <div className="flex gap-1.5 pb-1">
            <button
              onClick={() => handleCategorySelect('all')}
              className={cn(
                'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                selectedCategory === null
                  ? 'border-[#f4b53e] bg-[#f4b53e] text-black'
                  : 'border-[#dddddd] bg-white text-[#707070] hover:text-[#252531]'
              )}
            >
              All
            </button>
            {GAME_CATEGORIES.map((cat) => (
              <button
                key={cat.code}
                onClick={() => handleCategorySelect(cat.code)}
                className={cn(
                  'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  selectedCategory === cat.code
                    ? 'border-[#f4b53e] bg-[#f4b53e] text-black'
                    : 'border-[#dddddd] bg-white text-[#707070] hover:text-[#252531]'
                )}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Favourite toggle */}
        <button
          onClick={() => setShowFavourites(!showFavourites)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
            showFavourites
              ? 'border-red-400 bg-red-500/10 text-red-400'
              : 'border-[#dddddd] bg-white text-[#707070] hover:text-[#252531]'
          )}
        >
          <Heart className={cn('size-3.5', showFavourites && 'fill-current')} />
          Favourite
        </button>
      </div>

      {/* ── Provider Logos with Game Count Badges ── */}
      {providers.length > 0 && (
        <div className="relative mb-4">
          <div className="flex items-center gap-3">
            {/* ALL button */}
            <button
              onClick={() => setSelectedProvider(null)}
              className={cn(
                'flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 transition-all',
                selectedProvider === null
                  ? 'border-[#f4b53e] bg-[#f4b53e]/10'
                  : 'border-[#dddddd] bg-white hover:border-[#f4b53e]/30'
              )}
            >
              <span className="text-2xl">🎰</span>
              <span className="mt-1 text-xs font-bold">ALL</span>
            </button>

            {/* Provider scroll area */}
            <div className="relative flex-1 overflow-hidden">
              <div
                ref={providerScrollRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
              >
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => handleProviderSelect(provider.code)}
                    className={cn(
                      'group relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-xl border-2 transition-all',
                      selectedProvider === provider.code
                        ? 'border-[#f4b53e] bg-[#f4b53e]/10'
                        : 'border-[#dddddd] bg-white hover:border-[#f4b53e]/30'
                    )}
                  >
                    {/* Game count badge */}
                    <div className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-bold text-white">
                      {provider.gameCount}
                    </div>
                    <span className="text-center text-[10px] font-semibold leading-tight text-[#252531]">
                      {provider.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Scroll arrows */}
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => scrollProviders('left')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dddddd] bg-white text-[#707070] hover:text-[#252531]"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => scrollProviders('right')}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#dddddd] bg-white text-[#707070] hover:text-[#252531]"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sub-category Tabs (kzkzb style text tabs) ── */}
      <div className="mb-4 flex items-center gap-6 border-b border-[#dddddd] pb-3">
        {subCategories.map((sub) => (
          <button
            key={sub.label}
            onClick={() => setSelectedSubCategory(sub.label)}
            className={cn(
              'flex items-center gap-1.5 text-lg font-semibold transition-colors',
              selectedSubCategory === sub.label
                ? 'text-[#252531]'
                : 'text-[#707070] hover:text-[#252531]/70'
            )}
          >
            <span className="text-base">{sub.icon}</span>
            {sub.label}
          </button>
        ))}
      </div>

      {/* ── Section Title ── */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-lg">{categoryInfo?.icon ?? '🎰'}</span>
        <h3 className="text-lg font-semibold">
          {categoryInfo?.name ?? '전체 게임'}
        </h3>
      </div>

      {/* ── Game Grid (6 columns, square cards with overlay) ── */}
      {isLoading ? (
        <GameGridSkeleton />
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <span className="text-4xl">🎮</span>
          <p className="text-sm text-[#707070]">
            아직 게임 데이터가 없습니다
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {games.map((game) => (
              <GameCardOverlay
                key={game.id}
                game={game}
                isAuthenticated={isAuthenticated}
                onPlay={handlePlay}
                onDemo={handleDemo}
              />
            ))}
          </div>

          {/* Displaying count + Load More */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-sm text-[#707070]">
              Displaying {games.length} of {totalGames} games
            </p>
            {hasMore && (
              <button
                onClick={loadMoreGames}
                disabled={isLoadingMore}
                className="min-w-[200px] rounded-lg border border-[#dddddd] bg-white px-6 py-3 text-sm font-medium text-[#252531] hover:border-[#f4b53e] disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    로딩 중...
                  </span>
                ) : (
                  'Load More'
                )}
              </button>
            )}
          </div>
        </>
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

// ──────────────────── Game Card (kzkzb overlay style) ────────────────────

const GameCardOverlay = ({
  game,
  isAuthenticated,
  onPlay,
  onDemo,
}: {
  game: Game;
  isAuthenticated: boolean;
  onPlay: (g: Game) => void;
  onDemo: (g: Game) => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl transition-transform hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => (isAuthenticated ? onPlay(game) : onDemo(game))}
    >
      {/* Thumbnail */}
      {game.thumbnail && !imageError ? (
        <Image
          src={game.thumbnail}
          alt={game.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 16vw"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#f4b53e]/20 via-[#edeef3] to-[#f4b53e]/10">
          <span className="text-3xl font-bold text-[#707070]/50">
            {game.name.charAt(0)}
          </span>
        </div>
      )}

      {/* Bottom gradient overlay with name + provider (kzkzb style) */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-2 pb-2 pt-8">
        <p className="truncate text-xs font-bold uppercase tracking-wide text-white">
          {game.name}
        </p>
        <p className="truncate text-[10px] font-medium uppercase text-white/60">
          {game.providerName}
        </p>
      </div>

      {/* Hover overlay with Play button */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}
      >
        {isAuthenticated ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(game);
            }}
            className="rounded-lg bg-[#f4b53e] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#f4b53e]/90"
          >
            Play Now
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDemo(game);
            }}
            className="rounded-lg bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/30"
          >
            무료 체험
          </button>
        )}
      </div>
    </div>
  );
};

// ──────────────────── Skeleton ────────────────────

const GameGridSkeleton = () => (
  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
    {Array.from({ length: 18 }).map((_, i) => (
      <div key={i} className="aspect-square w-full animate-pulse rounded-xl bg-[#edeef3]" />
    ))}
  </div>
);
