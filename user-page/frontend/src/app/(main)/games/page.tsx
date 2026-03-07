'use client';

import { useEffect, useState, useMemo, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, X, Loader2, ChevronLeft, 
  Gamepad2, MonitorPlay, Blocks, Rocket, 
  Spade, Gamepad, Trophy, Dices, Zap 
} from 'lucide-react';
import { useGameStore, type Game } from '@/stores/game-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';

/* --- Constants --- */

const INITIAL_LOAD = 60;
const LOAD_MORE = 60;

interface CategoryTab {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', name: '전체', icon: <Gamepad2 strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'live', name: '라이브카지노', icon: <MonitorPlay strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'slot', name: '슬롯', icon: <Blocks strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'crash', name: '크래시', icon: <Rocket strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'table', name: '테이블', icon: <Spade strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'arcade', name: '아케이드', icon: <Gamepad strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'sports', name: '스포츠', icon: <Trophy strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'casino', name: '카지노', icon: <Dices strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
  { id: 'instant', name: '인스턴트', icon: <Zap strokeWidth={2.5} className="size-[1.15em] shrink-0" /> },
];

/* --- Inner Page (uses useSearchParams) --- */

function GamesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const providerParam = searchParams.get('provider') || '';

  const { providers, games, isLoading, fetchAllGames } = useGameStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_LOAD);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (games.length === 0) fetchAllGames();
  }, [games.length, fetchAllGames]);

  // Reset visible count when filters change
  useEffect(() => {
    setTimeout(() => setVisibleCount(INITIAL_LOAD), 0);
  }, [categoryParam, providerParam, searchQuery]);

  // Filter games by category + provider + search
  const filteredGames = useMemo(() => {
    let filtered = games;

    if (categoryParam && categoryParam !== 'all') {
      filtered = filtered.filter((g) => g.category === categoryParam);
    }

    if (providerParam) {
      filtered = filtered.filter((g) => g.provider === providerParam);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (g) => g.name.toLowerCase().includes(q) || g.providerName.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [games, categoryParam, providerParam, searchQuery]);

  // Slice for progressive rendering
  const visibleGames = useMemo(
    () => filteredGames.slice(0, visibleCount),
    [filteredGames, visibleCount]
  );
  const hasMore = visibleCount < filteredGames.length;

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + LOAD_MORE);
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore]);

  // Get providers for current category (for provider filter chips)
  const categoryProviders = useMemo(() => {
    if (!providers.length) return [];
    if (categoryParam === 'all') return providers;
    return providers.filter((p) => {
      const catCount = p.categories[categoryParam];
      return catCount && catCount > 0;
    }).sort((a, b) => (b.categories[categoryParam] || 0) - (a.categories[categoryParam] || 0));
  }, [providers, categoryParam]);

  // Current category info
  const currentCategory = CATEGORIES.find((c) => c.id === categoryParam) || CATEGORIES[0];

  // Current provider info
  const currentProvider = providerParam
    ? providers.find((p) => p.code === providerParam)
    : null;

  const handleCategoryChange = useCallback((id: string) => {
    if (id === 'all') {
      router.push('/games');
    } else {
      router.push(`/games?category=${id}`);
    }
    setSearchQuery('');
  }, [router]);

  const handleProviderClick = useCallback((code: string) => {
    if (providerParam === code) {
      if (categoryParam === 'all') {
        router.push('/games');
      } else {
        router.push(`/games?category=${categoryParam}`);
      }
    } else {
      const params = new URLSearchParams();
      if (categoryParam !== 'all') params.set('category', categoryParam);
      params.set('provider', code);
      router.push(`/games?${params.toString()}`);
    }
  }, [router, providerParam, categoryParam]);

  const handlePlayGame = useCallback((game: Game) => {
    setSelectedGame(game);
  }, []);

  return (
    <div className="w-full pb-20 lg:pb-10">
      <div className="mx-auto w-full max-w-300 px-4 lg:px-8 mt-4 lg:mt-6">

        {/* Header */}
        <div className="mb-5 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {providerParam && (
              <button
                onClick={() => {
                  if (categoryParam === 'all') router.push('/games');
                  else router.push(`/games?category=${categoryParam}`);
                }}
                className="flex size-9 items-center justify-center rounded-xl bg-white border border-[#e2e8f0] text-[#64748b] shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all"
              >
                <ChevronLeft className="size-5" strokeWidth={3} />
              </button>
            )}
            <div className="flex items-center gap-3">
              <div className="relative flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4da1ff] to-[#1e6adb] shadow-[0_4px_10px_rgba(30,106,219,0.3),_inset_0_2px_0_rgba(255,255,255,0.4),_inset_0_-3px_0_rgba(226,232,240,0.2)] border border-[#3b82f6]/50 transform rotate-3">
                <span className="text-[26px] text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] pb-0.5">
                  {currentCategory.icon}
                </span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-[22px] font-black text-[#1e293b] tracking-tight lg:text-[28px] flex items-center gap-2">
                  {currentProvider ? currentProvider.name : currentCategory.name}
                </h1>
                <p className="mt-0.5 text-[13px] font-bold text-[#94a3b8]">
                  {currentProvider
                    ? `${currentProvider.name} 게임 ${filteredGames.length}개`
                    : filteredGames.length > 0
                      ? `총 ${filteredGames.length}개 프리미엄 게임`
                      : isLoading ? '게임 로딩 중...' : '게임을 불러오는 중...'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-5 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[14px] blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
          <div className="relative flex items-center">
            <Search className="absolute left-4 size-[18px] text-[#94a3b8] group-focus-within:text-[#3b82f6] transition-colors" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="게임 또는 프로바이더 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-[48px] rounded-[14px] border border-[#cbd5e1] bg-[#fbfcfd] py-2 pl-11 pr-10 text-[15px] font-bold text-[#1e293b] placeholder:text-[#94a3b8] placeholder:font-bold focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 focus:bg-white focus:outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 text-[#94a3b8] hover:text-[#ef4444] hover:scale-110 transition-all"
              >
                <X className="size-5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Category Tabs (hide when browsing a specific provider) */}
        {!providerParam && (
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex shrink-0 items-center justify-center gap-2 h-[42px] px-4 rounded-xl font-black text-[14px] transform hover:-translate-y-0.5 transition-all outline-none ${
                  categoryParam === cat.id
                    ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[0_4px_10px_rgba(30,106,219,0.3),_inset_0_2px_0_rgba(255,255,255,0.3)] border-none'
                    : 'bg-gradient-to-b from-white to-[#f8fafc] text-[#64748b] border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                <span className={`text-[17px] ${categoryParam === cat.id ? 'text-white drop-shadow-sm' : 'text-[#94a3b8]'}`}>
                  {cat.icon}
                </span> 
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Provider Filter Chips (show when in a category) */}
        {!providerParam && categoryProviders.length > 1 && (
          <div className="mb-6 flex gap-2 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {categoryProviders.map((p) => (
              <button
                key={p.code}
                onClick={() => handleProviderClick(p.code)}
                className="shrink-0 flex items-center justify-center h-[34px] rounded-lg border border-[#e2e8f0] bg-white px-3.5 text-[13px] font-extrabold text-[#64748b] shadow-sm hover:border-[#3b82f6] hover:bg-blue-50/50 hover:text-[#3b82f6] hover:shadow-[0_2px_8px_rgba(59,130,246,0.15)] transform hover:-translate-y-px transition-all"
              >
                {p.name}
                <span className="ml-1.5 rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-black text-[#94a3b8]">
                  {categoryParam === 'all' ? p.total : (p.categories[categoryParam] || 0)}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {isLoading && games.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-[#feb614]" />
            <p className="mt-3 text-[14px] text-[#98a7b5]">게임을 불러오는 중...</p>
          </div>
        )}

        {/* Game Grid */}
        {!isLoading && filteredGames.length === 0 && games.length > 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="text-[40px]">🎮</span>
            <p className="mt-3 text-[15px] font-bold text-[#252531]">게임을 찾을 수 없습니다</p>
            <p className="mt-1 text-[13px] text-[#98a7b5]">
              {searchQuery ? '다른 검색어를 입력해보세요' : '다른 카테고리를 선택해보세요'}
            </p>
          </div>
        )}

        {visibleGames.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {visibleGames.map((game) => (
                <GameCard key={game.uid} game={game} onPlay={handlePlayGame} />
              ))}
            </div>

            {/* Intersection Observer sentinel for infinite scroll */}
            {hasMore && (
              <div ref={sentinelRef} className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-[#98a7b5]" />
                <span className="ml-2 text-[13px] text-[#98a7b5]">더 불러오는 중...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Game Launch Modal */}
      <GameLaunchModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
}

/* --- Page Component with Suspense --- */

export default function GamesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-[#feb614]" />
        </div>
      }
    >
      <GamesPageInner />
    </Suspense>
  );
}
