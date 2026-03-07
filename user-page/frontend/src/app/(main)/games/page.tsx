'use client';

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, Loader2, ChevronLeft } from 'lucide-react';
import { useGameStore, type Game } from '@/stores/game-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';

/* --- Category Definitions --- */

interface CategoryTab {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: CategoryTab[] = [
  { id: 'all', name: '전체', icon: '🎮' },
  { id: 'live', name: '라이브카지노', icon: '🃏' },
  { id: 'slot', name: '슬롯', icon: '🎰' },
  { id: 'crash', name: '크래시', icon: '🚀' },
  { id: 'table', name: '테이블', icon: '♠️' },
  { id: 'arcade', name: '아케이드', icon: '🕹️' },
  { id: 'sports', name: '스포츠', icon: '⚽' },
  { id: 'casino', name: '카지노', icon: '🎲' },
  { id: 'instant', name: '인스턴트', icon: '⚡' },
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

  useEffect(() => {
    if (games.length === 0) fetchAllGames();
  }, [games.length, fetchAllGames]);

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

  const handleCategoryChange = (id: string) => {
    if (id === 'all') {
      router.push('/games');
    } else {
      router.push(`/games?category=${id}`);
    }
    setSearchQuery('');
  };

  const handleProviderClick = (code: string) => {
    if (providerParam === code) {
      // Deselect provider
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
  };

  return (
    <div className="w-full pb-20 lg:pb-10">
      <div className="mx-auto w-full max-w-300 px-4 lg:px-8 mt-4 lg:mt-6">

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            {providerParam && (
              <button
                onClick={() => {
                  if (categoryParam === 'all') router.push('/games');
                  else router.push(`/games?category=${categoryParam}`);
                }}
                className="flex size-8 items-center justify-center rounded-full bg-[#f1f2f7] text-[#6b7280] hover:bg-[#e8e8e8] transition-colors"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            <div>
              <h1 className="text-[22px] font-black text-[#252531] lg:text-[28px]">
                {currentProvider
                  ? currentProvider.name
                  : currentCategory.icon + ' ' + currentCategory.name}
              </h1>
              <p className="mt-0.5 text-[13px] text-[#98a7b5]">
                {currentProvider
                  ? `${currentProvider.name} 게임 ${filteredGames.length}개`
                  : filteredGames.length > 0
                    ? `총 ${filteredGames.length}개 게임`
                    : isLoading ? '게임 로딩 중...' : '게임을 불러오는 중...'}
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#98a7b5]" />
          <input
            type="text"
            placeholder="게임 또는 프로바이더 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-[10px] border border-[#e8e8e8] bg-[#f9fafb] py-2.5 pl-10 pr-10 text-[14px] text-[#252531] placeholder:text-[#b0b0b0] focus:border-[#feb614] focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a7b5] hover:text-[#252531]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category Tabs (hide when browsing a specific provider) */}
        {!providerParam && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-bold transition-all ${
                  categoryParam === cat.id
                    ? 'bg-[#feb614] text-[#252531] shadow-sm'
                    : 'bg-[#f1f2f7] text-[#6b7280] hover:bg-[#e8e8e8]'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Provider Filter Chips (show when in a category) */}
        {!providerParam && categoryProviders.length > 1 && (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categoryProviders.map((p) => (
              <button
                key={p.code}
                onClick={() => handleProviderClick(p.code)}
                className="shrink-0 rounded-full border border-[#e8e8e8] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#6b7280] hover:border-[#feb614] hover:text-[#252531] transition-colors"
              >
                {p.name}
                <span className="ml-1 text-[10px] text-[#b0b0b0]">
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

        {filteredGames.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
            {filteredGames.map((game) => (
              <GameCard key={game.uid} game={game} onPlay={setSelectedGame} />
            ))}
          </div>
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
