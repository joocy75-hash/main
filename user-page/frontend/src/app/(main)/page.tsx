'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game } from '../../../../shared/types/game';

// ──────────────────── Data ────────────────────

const ANNOUNCEMENT_TEXT =
  'Welcome to KZ Casino — your ultimate destination for thrilling games, big wins, and nonstop entertainment!';

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

const START_PLAYING = [
  { name: 'Casino', icon: '🎲', gradient: 'from-emerald-500 to-teal-600', href: '/games?category=casino' },
  { name: 'Sportsbook', icon: '⚽', gradient: 'from-blue-500 to-indigo-600', href: '/sports' },
  { name: 'Marble', icon: '🔮', gradient: 'from-amber-500 to-orange-600', href: '/minigame' },
];

// Matches kzkzb.com casino section tabs
const CASINO_TABS = [
  { name: 'Local Games', icon: '🏠', href: '/games' },
  { name: 'New Releases', icon: '🆕', href: '/games?sort=new' },
  { name: 'Hot Games', icon: '🔥', href: '/games?sort=hot' },
  { name: 'Slots', icon: '🎰', href: '/games?category=slot' },
  { name: 'Live Casino', icon: '🎲', href: '/games?category=casino' },
  { name: 'Fishing', icon: '🐟', href: '/games?category=shooting' },
  { name: 'Card Game', icon: '🃏', href: '/games?category=holdem' },
  { name: 'Lottery', icon: '🎫', href: '/games?category=coin' },
];

// Mock: Recent Big Wins
const RECENT_BIG_WINS = [
  { game: 'Football Fever', player: 'Player001', amount: 'BRL 9,074.00', img: '⚽' },
  { game: 'Wild Wet Win', player: 'User123', amount: 'BRL 1,649.00', img: '🌊' },
  { game: '5 Fortune Dragons', player: 'Dragon88', amount: 'BRL 2,211.00', img: '🐉' },
  { game: 'First Love', player: 'Heart99', amount: 'BRL 4,976.00', img: '💕' },
  { game: 'Royale House', player: 'King777', amount: 'BRL 3,886.00', img: '👑' },
  { game: 'Royal Katt', player: 'Cat456', amount: 'BRL 3,655.00', img: '🐱' },
  { game: 'Caishen', player: 'Lucky88', amount: 'BRL 261.00', img: '🧧' },
  { game: 'Journey Wild', player: 'Wild22', amount: 'BRL 5,467.00', img: '🌿' },
  { game: 'Tiger Dance', player: 'Tiger01', amount: 'BRL 8,120.00', img: '🐯' },
  { game: 'Gold Rush', player: 'Gold99', amount: 'BRL 12,340.00', img: '💰' },
];

// Mock: Live Sports
const LIVE_SPORTS = [
  { league: 'Japan J2/J3', count: 75, home: 'Oita Trinita', away: 'Reilac Shiga FC', odds: ['0.82', '1.11'] },
  { league: 'UEFA Champions League', count: 190, home: 'Atalanta', away: 'Borussia Dortmund', odds: ['0.92', '1.00'] },
  { league: 'Spain La Liga 2', count: 180, home: 'AD Ceuta', away: 'Cordoba CF', odds: ['1.03', '0.87'] },
  { league: 'Switzerland Super League', count: 95, home: 'FC Zurich', away: 'FC Basel', odds: ['1.15', '0.95'] },
];

// Mock: Latest Round & Race
const LATEST_BETS = [
  { event: 'First Person V5', player: 'Yangwnba43', amount: '184.43', multiplier: '1.28x', profit: '+40.08', positive: true },
  { event: 'Plinko', player: 'Mikowoko51', amount: '117.39', multiplier: '2.27x', profit: '-6.17', positive: false },
  { event: 'PixiePOP™', player: 'Player040', amount: '99.57', multiplier: '0.32x', profit: '+48.24', positive: true },
  { event: 'Hash Dice', player: 'MuMummcc55', amount: '61.29', multiplier: '1.00x', profit: '+37.25', positive: true },
  { event: 'Hash Dice', player: 'Onegirl25', amount: '88.61', multiplier: '1.13x', profit: '+47.54', positive: true },
  { event: 'Wild Bounty', player: 'Mikowoko8', amount: '142.75', multiplier: '0.45x', profit: '-20.44', positive: false },
];

// Mock: Provider logos
const PROVIDERS = [
  'Evolution', 'Pragmatic Play', 'SABA Sports', 'Ezugi', 'PG Soft',
  'JILI', 'CQ9', 'Habanero', 'Spade Gaming', 'Micro Gaming',
];

// ──────────────────── Components ────────────────────

function SectionTitle({ icon, title, extra }: { icon?: string; title: string; extra?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h2 className="text-lg font-semibold text-[#252531] lg:text-xl">{title}</h2>
      </div>
      {extra}
    </div>
  );
}

// ──────────────────── Page ────────────────────

export default function MainLobbyPage() {
  const { popularGames, fetchPopularGames } = useGameStore();
  const { isAuthenticated } = useAuthStore();
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [betTab, setBetTab] = useState<'latest' | 'high'>('latest');
  const marqueeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchPopularGames();
      setIsLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlay = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  const handleDemo = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-0">
      {/* ─── 1. Announcement Marquee ─── */}
      <div className="mb-4 flex items-center gap-2 overflow-hidden rounded-lg bg-[#edeef3]/50 px-3 py-1.5">
        <Volume2 className="size-3.5 shrink-0 text-[#707070]" />
        <div ref={marqueeRef} className="animate-marquee whitespace-nowrap text-xs text-[#707070]">
          {ANNOUNCEMENT_TEXT}
          <span className="mx-12">{ANNOUNCEMENT_TEXT}</span>
        </div>
      </div>

      {/* ─── 2. Hero Banner ─── */}
      <div className="mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-white to-[#edeef3]/30">
        <div className="flex flex-col items-center gap-6 px-6 py-8 lg:flex-row lg:px-10 lg:py-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-xl font-bold text-[#252531] lg:text-2xl">
              SIGN UP & <span className="text-[#f4b53e]">GET</span> REWARD UP TO
            </h1>
            <p className="mt-2 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-4xl font-extrabold text-transparent lg:text-5xl">
              $20,000.00
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-2 text-sm font-bold text-black transition-colors hover:from-amber-500 hover:to-yellow-600"
              >
                Sign Up Now
              </Link>
              <span className="text-sm text-[#707070]">or</span>
              <span className="flex size-8 items-center justify-center rounded-full bg-sky-500 text-white text-sm">📨</span>
            </div>
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-end">
            <div className="flex gap-4">
              <div className="flex flex-col items-center gap-1">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#f4b53e]/20 text-2xl">⭐</div>
                <span className="text-[10px] text-[#707070]">OFFICIAL PARTNER</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#f4b53e]/20 text-2xl">☁️</div>
                <span className="text-[10px] text-[#707070]">OFFICIAL PARTNER</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Promo Cards (3-col) ─── */}
      <div className="mb-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {PROMO_CARDS.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className={cn(
              'flex flex-col justify-center rounded-xl bg-gradient-to-r px-5 py-6 text-white shadow-md transition-transform hover:scale-[1.02]',
              card.gradient
            )}
          >
            <span className="text-lg font-extrabold leading-tight">{card.title}</span>
            <span className="mt-0.5 text-xs font-medium opacity-90">{card.subtitle}</span>
          </Link>
        ))}
      </div>

      {/* ─── 4. Recent Big Wins ─── */}
      <section className="mb-10">
        <SectionTitle icon="🏆" title="Recent Big Wins" />
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {RECENT_BIG_WINS.map((win, i) => (
              <div
                key={i}
                className="flex w-[120px] shrink-0 flex-col items-center gap-1.5 rounded-lg border border-[#dddddd] bg-white p-2 text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-lg bg-[#edeef3] text-2xl">
                  {win.img}
                </div>
                <span className="line-clamp-1 text-[11px] font-medium text-[#252531]">{win.game}</span>
                <span className="text-[10px] text-[#707070]">{win.player}</span>
                <span className="text-[11px] font-bold text-green-600">{win.amount}</span>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* ─── 5. Start Playing (3 cards) ─── */}
      <section className="mb-10">
        <SectionTitle icon="▶️" title="Start Playing" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {START_PLAYING.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group relative overflow-hidden rounded-xl bg-gradient-to-br p-6 text-white shadow-md transition-transform hover:scale-[1.02]',
                item.gradient
              )}
            >
              <span className="absolute right-4 top-4 text-4xl opacity-30">{item.icon}</span>
              <div className="relative z-10">
                <h3 className="text-lg font-bold">{item.name}</h3>
                <span className="mt-1 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
                  Go To {item.name} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 6. Casino Section (tabs + game grid) ─── */}
      <section className="mb-10">
        <SectionTitle
          icon="🎰"
          title="Casino"
          extra={
            <Link href="/games" className="text-[#f4b53e] hover:underline text-sm font-medium">
              View All &gt;
            </Link>
          }
        />

        {/* Category tabs */}
        <ScrollArea className="mb-4 w-full">
          <div className="flex gap-2 pb-1">
            {CASINO_TABS.map((tab, i) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  activeTab === i
                    ? 'border-[#f4b53e] bg-[#f4b53e]/10 text-[#f4b53e]'
                    : 'border-[#dddddd] bg-white text-[#707070] hover:border-[#f4b53e]/50'
                )}
              >
                <span>{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Game grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="animate-pulse rounded-lg bg-[#edeef3] aspect-square w-full" />
                <div className="animate-pulse rounded-lg bg-[#edeef3] h-3 w-3/4" />
              </div>
            ))}
          </div>
        ) : popularGames.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {popularGames.slice(0, 8).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isAuthenticated={isAuthenticated}
                onPlay={handlePlay}
                onDemo={handleDemo}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#dddddd] py-12 text-center">
            <span className="text-3xl">🎮</span>
            <p className="text-sm text-[#707070]">아직 게임 데이터가 없습니다</p>
            <a
              href="/games"
              className="inline-flex items-center justify-center rounded-md border border-[#dddddd] px-4 py-2 text-sm font-medium text-[#707070] transition-colors hover:border-[#f4b53e]"
            >
              게임 둘러보기
            </a>
          </div>
        )}
      </section>

      {/* ─── 7. Live Sports ─── */}
      <section className="mb-10">
        <SectionTitle icon="⚽" title="Live Sports" />
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {LIVE_SPORTS.map((match, i) => (
              <Link
                key={i}
                href="/sports"
                className="w-[300px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 p-4 text-white shadow-md transition-transform hover:scale-[1.01]"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="line-clamp-1 text-xs font-medium">{match.league}</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">{match.count} &gt;</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/20 text-lg">⚽</div>
                    <span className="line-clamp-1 text-center text-[11px] font-medium">{match.home}</span>
                  </div>
                  <span className="text-lg font-extrabold">VS</span>
                  <div className="flex flex-1 flex-col items-center gap-1">
                    <div className="flex size-10 items-center justify-center rounded-full bg-white/20 text-lg">⚽</div>
                    <span className="line-clamp-1 text-center text-[11px] font-medium">{match.away}</span>
                  </div>
                </div>
                <div className="mt-3 flex justify-between text-[11px]">
                  <span className="rounded bg-white/20 px-2 py-0.5">{match.odds[0]}</span>
                  <span className="rounded bg-white/20 px-2 py-0.5">{match.odds[1]}</span>
                </div>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* ─── 8. Latest Round & Race ─── */}
      <section className="mb-10">
        <SectionTitle title="Latest Round & Race" />
        <div className="overflow-hidden rounded-xl border border-[#dddddd] bg-white">
          {/* Tabs */}
          <div className="flex border-b border-[#dddddd]">
            <button
              onClick={() => setBetTab('latest')}
              className={cn(
                'flex-1 py-3 text-center text-sm font-medium transition-colors',
                betTab === 'latest' ? 'bg-[#edeef3] text-[#252531]' : 'text-[#707070] hover:text-[#252531]'
              )}
            >
              Latest Bet
            </button>
            <button
              onClick={() => setBetTab('high')}
              className={cn(
                'flex-1 py-3 text-center text-sm font-medium transition-colors',
                betTab === 'high' ? 'bg-[#edeef3] text-[#252531]' : 'text-[#707070] hover:text-[#252531]'
              )}
            >
              High Roller
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#dddddd] text-xs text-[#707070]">
                  <th className="px-4 py-2.5 text-left font-medium">Event</th>
                  <th className="px-4 py-2.5 text-left font-medium">Player</th>
                  <th className="px-4 py-2.5 text-right font-medium">Bet amount</th>
                  <th className="px-4 py-2.5 text-center font-medium">Multiplier</th>
                  <th className="px-4 py-2.5 text-right font-medium">Profit</th>
                </tr>
              </thead>
              <tbody>
                {LATEST_BETS.map((bet, i) => (
                  <tr key={i} className="border-b border-[#dddddd]/50 transition-colors hover:bg-[#edeef3]/30">
                    <td className="px-4 py-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded bg-[#f4b53e]/10 text-xs">🎮</span>
                        <span className="text-[#252531]">{bet.event}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-left text-[#707070]">{bet.player}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-[#252531]">{bet.amount}</td>
                    <td className="px-4 py-2.5 text-center text-[#707070]">{bet.multiplier}</td>
                    <td className={cn('px-4 py-2.5 text-right font-bold', bet.positive ? 'text-green-600' : 'text-red-500')}>
                      {bet.profit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── 9. Providers ─── */}
      <section className="mb-10">
        <SectionTitle icon="🎲" title="Providers" />
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {PROVIDERS.map((name) => (
              <div
                key={name}
                className="flex h-16 w-[150px] shrink-0 items-center justify-center rounded-xl border border-[#dddddd] bg-white px-4 text-center text-xs font-bold text-[#707070] transition-colors hover:border-[#f4b53e]/50"
              >
                {name}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      {/* Launch modal */}
      <GameLaunchModal
        game={selectedGame}
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
      />
    </div>
  );
}
