'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  Loader2,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GAME_CATEGORIES } from '@/lib/constants';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game, GameCategory } from '../../../../../shared/types/game';

// ──────────────────── Data ────────────────────

const PROMO_CARDS = [
  {
    title: 'LUCKY LACE',
    subtitle: 'IN KZ AI LIVE',
    gradient: 'from-red-500 to-rose-600',
    href: '/promotions',
  },
  {
    title: 'A MIRACULOUS',
    subtitle: 'INTERFACE & EXPERIENCE',
    gradient: 'from-violet-500 to-purple-600',
    href: '/promotions',
  },
  {
    title: 'KZ SPORTS',
    subtitle: 'REAL-TIME MATCH',
    gradient: 'from-amber-400 to-orange-500',
    href: '/sports',
  },
];

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
// Removed to use PROMO_CARDS

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
    // Avoid synchronous cascading render
    setTimeout(() => {
      setSelectedSubCategory('All Games');
    }, 0);
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
      {/* ── Banner Carousel (3 Promos) ── */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PROMO_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={cn(
              'flex flex-col justify-center rounded-[12px] bg-gradient-to-r px-5 py-6 text-white shadow-sm transition-transform hover:scale-[1.02]',
              card.gradient
            )}
          >
            <span className="text-[15px] font-extrabold leading-tight tracking-tight">{card.title}</span>
            <span className="mt-0.5 text-[9px] font-medium opacity-90">{card.subtitle}</span>
          </Link>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative mb-6 drop-shadow-sm">
        <Search className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#6b7280] opacity-70" />
        <input
          type="text"
          placeholder="Search your game"
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="h-[52px] w-full rounded-xl bg-[#f5f5f7] border border-[#e8e8e8] pl-12 pr-4 text-[15px] font-semibold text-[#252531] placeholder:text-[#6b7280] focus:outline-none"
        />
      </div>

      {/* ── Filter Bar ── */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[15px] font-bold text-[#252531]">
            <SlidersHorizontal className="size-4 text-[#feb614]" />
            Filter By
          </div>

          {/* Provider Dropdown (Mock) */}
          <button className="flex h-[42px] items-center justify-between gap-2 rounded-full bg-[#f8f8fa] px-5 text-[15px] font-bold text-[#252531] shadow-sm ml-2 border border-[#e8e8e8]">
            Provider: All <ChevronDown className="size-4 opacity-50" />
          </button>

          {/* Favourite Toggle */}
          <button
            onClick={() => setShowFavourites(!showFavourites)}
            className={cn(
              'flex h-[42px] shrink-0 items-center justify-center rounded-full bg-[#f5f5f7] px-6 text-[15px] font-bold shadow-sm transition-colors',
              showFavourites ? 'text-[#feb614]' : 'text-[#6b7280] hover:text-[#feb614]'
            )}
          >
            Favourite
          </button>
        </div>

        {/* Scroll arrows */}
        <div className="flex gap-1.5 hidden md:flex">
          <button
            onClick={() => scrollProviders('left')}
            className="flex h-10 w-10 items-center justify-center rounded bg-[#f8f8fa] text-[#6b7280] transition-colors hover:bg-[#f0f0f2] hover:text-[#252531]"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => scrollProviders('right')}
            className="flex h-10 w-10 items-center justify-center rounded bg-[#f8f8fa] text-[#6b7280] transition-colors hover:bg-[#f0f0f2] hover:text-[#252531]"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* ── Provider Logos with Game Count Badges ── */}
      {providers.length > 0 && (
        <div className="relative mb-6">
          <div className="flex items-center gap-2 overflow-hidden py-2" ref={providerScrollRef} style={{ scrollbarWidth: 'none' }}>
            {/* ALL button */}
            <button
              onClick={() => setSelectedProvider(null)}
              className={cn(
                'group relative flex h-[72px] w-[130px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[14px] transition-all',
                selectedProvider === null
                  ? 'bg-gradient-to-r from-[#f0f0f2] to-[#e8e8e8] shadow-md border-[3px] border-[#e8e8e8]'
                  : 'bg-[#f8f8fa] shadow-sm border-[3px] border-transparent hover:border-[#e8e8e8]'
              )}
            >
              <Image src="/images/category-icons/slots.webp" alt="" width={48} height={48} className="absolute -left-2 -top-4 size-12 opacity-20" />
              <span className={cn("relative z-10 text-[18px] font-black tracking-widest", selectedProvider === null ? "text-[#252531]" : "text-[#252531]")}>
                ALL
              </span>
            </button>

            {providers.map((provider) => (
              <button
                key={provider.id}
                onClick={() => handleProviderSelect(provider.code)}
                className={cn(
                  'group relative flex h-[72px] w-[130px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[14px] transition-all',
                  selectedProvider === provider.code
                    ? 'bg-[#1e4a46] shadow-md border-[3px] border-[#20b2aa]'
                    : 'bg-gradient-to-tr from-[#303846] to-[#404856] shadow-sm border-[3px] border-transparent hover:border-[#dddddd]'
                )}
              >
                {/* Mock abstract graphics based on provider */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay">
                  {/* Decorative background for provider cards */}
                  <div className="absolute -right-4 -top-8 size-20 rounded-full bg-white/20 blur-xl"></div>
                </div>

                {/* Game count badge */}
                <div className="absolute right-1 top-1 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#feb614] px-1.5 text-[11px] font-black text-white shadow-sm">
                  {provider.gameCount}
                </div>
                
                <span className="relative z-10 text-center text-[13px] font-black leading-tight text-white mt-4">
                  {provider.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Sub-category Tabs (kzkzb style single container) ── */}
      <div className="mb-6 flex overflow-x-auto no-scrollbar">
        <div className="flex h-[52px] items-center gap-2 rounded-xl bg-[#f8f8fa] px-2 shadow-sm min-w-max">
          {subCategories.map((sub) => (
            <button
              key={sub.label}
              onClick={() => setSelectedSubCategory(sub.label)}
              className={cn(
                'flex h-[36px] items-center gap-2 rounded-lg px-4 text-[15px] font-bold transition-colors',
                selectedSubCategory === sub.label
                  ? 'bg-transparent text-[#252531]'
                  : 'text-[#6b7280] hover:bg-[#f0f0f2]'
              )}
            >
              <span className="text-base opacity-70">{sub.icon}</span>
              {sub.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Section Title ── */}
      <div className="mb-5 flex items-center gap-3 pl-1">
        <Image src={`/images/category-icons/${currentCategory === 'casino' ? 'live_casino' : currentCategory === 'slot' ? 'slots' : currentCategory === 'shooting' ? 'fishing' : currentCategory === 'coin' ? 'marble' : currentCategory === 'mini_game' ? 'arcade' : currentCategory}.webp`} alt="" width={22} height={22} className="size-[22px] opacity-70" />
        <h3 className="text-[20px] font-black text-[#252531]">
          {categoryInfo?.name ?? 'Live Casino'}
        </h3>
      </div>

      {/* ── Game Grid (6 columns, square cards with overlay) ── */}
      {isLoading ? (
        <GameGridSkeleton />
      ) : games.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Image src="/images/category-icons/arcade.webp" alt="" width={48} height={48} className="size-12 opacity-50" />
          <p className="text-sm text-[#6b7280]">
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
            <p className="text-sm text-[#6b7280]">
              Displaying {games.length} of {totalGames} games
            </p>
            {hasMore && (
              <button
                onClick={loadMoreGames}
                disabled={isLoadingMore}
                className="min-w-[200px] rounded-lg border border-[#e8e8e8] bg-[#f8f8fa] px-6 py-3 text-sm font-medium text-[#252531] hover:border-[#feb614] disabled:opacity-50"
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
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#feb614]/20 via-[#f8f8fa] to-[#feb614]/10">
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
            className="rounded-lg bg-[#feb614] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#feb614]/90"
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
      <div key={i} className="aspect-square w-full animate-pulse rounded-xl bg-[#f8f8fa]" />
    ))}
  </div>
);
