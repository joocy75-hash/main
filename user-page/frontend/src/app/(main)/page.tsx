'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2 } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { GameCard } from '@/components/game/game-card';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import type { Game } from '../../../../shared/types/game';

// -------------------- Constants --------------------

const ANNOUNCEMENT_TEXT = 'Welcome to Kzing — your ultimate destination for thrilling games, big wins, and nonstop entertainment!';

const START_PLAYING = [
  { name: 'Casino', img: '/images/theme/feature_casino.webp', href: '/games?category=casino' },
  { name: 'Sportsbook', img: '/images/theme/feature_sports.webp', href: '/sports' },
  { name: 'Marble', img: '/images/theme/feature_gp14.webp', href: '/minigame' },
];

const CASINO_TABS = [
  { name: 'New Releases', img: '/images/category-icons/new_releases.webp', href: '?sort=new' },
  { name: 'Hot Games', img: '/images/category-icons/hot_games.webp', href: '?sort=hot' },
  { name: 'Slots', img: '/images/category-icons/slots.webp', href: '?category=slot' },
  { name: 'Live Casino', img: '/images/category-icons/live_casino.webp', href: '?category=casino' },
  { name: 'Fishing', img: '/images/category-icons/fishing.webp', href: '?category=shooting' },
  { name: 'Card Game', img: '/images/category-icons/card_game.webp', href: '?category=holdem' },
  { name: 'Lottery', img: '/images/category-icons/lottery.webp', href: '?category=coin' },
  { name: 'Arcade', img: '/images/category-icons/arcade.webp', href: '?category=arcade' },
  { name: 'Marble', img: '/images/category-icons/marble.webp', href: '/minigame' },
];

const PROMO_SHORTCUTS = [
  { name: 'Check-In', icon: '/images/theme/checkin_icon.gif', href: '/promotions/attendance', desc: 'Daily Bonus' },
  { name: 'Gift Bonus', icon: '/images/theme/gift_reward_icon.gif', href: '/promotions', desc: 'Claim Rewards' },
  { name: 'Lucky Spin', icon: '/images/theme/mission_icon.gif', href: '/promotions/spin', desc: 'Spin to Win' },
];

const RECENT_BIG_WINS = [
  { game: 'Sticky Bandits Thunder Rail', amount: '842,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Sticky_Bandits_Thunder_Rail_pop_001378cc_qsp_en.webp' },
  { game: 'Beastwood', amount: '7,666,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Beastwood_pop_df0ef2b4_qsp_en.webp' },
  { game: 'Buffalo Blitz: Cash Collect', amount: '3,726,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Buffalo_Blitz_Cash_Collect_gpas_bufbcc_pop_en.webp' },
  { game: 'Azticons Chaos Clusters', amount: '8,630,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Azticons_Chaos_Clusters_en.webp' },
  { game: 'Betty Bonkers', amount: '3,701,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Betty_Bonkers_en.webp' },
  { game: 'Big Bad Wolf: Pigs of Steel', amount: '2,194,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Big_Bad_Wolf_Pigs_of_Steel_pop_340fe252_qsp_en.webp' },
  { game: 'Temple of Paw', amount: '75,000', img: 'https://static-mobile.mbzp67c522.com/yuus5k/images/games/pt2/Temple_of_paw_pop_d2c001cd_qsp_en.webp' },
];

const LIVE_SPORTS = [
  { league: '*UEFA Champions League - Playoff', count: 197, home: 'Atalanta', away: 'Borussia Dortmund', time: 'Thursday, 26 February 2026', bg: 'bg-gradient-to-r from-[#17274B] to-[#2D183B]', odds: ['- 0/0.5 0.96', '+ 0/0.5 0.96'] },
  { league: 'Spain La Liga 2', count: 188, home: 'AD Ceuta', away: 'Cordoba CF', time: 'Thursday, 26 February 2026', bg: 'bg-gradient-to-r from-[#2B1736] to-[#122F43]', odds: ['+ 0.0 1.07', '- 0.0 0.83'] },
  { league: 'Switzerland Super League', count: 173, home: 'FC Winterthur', away: 'FC Thun', time: 'Thursday, 26 February 2026', bg: 'bg-gradient-to-r from-[#17274B] to-[#2D183B]', odds: ['+ 1.5 0.85', '- 1.5 1.05'] },
  { league: 'Saudi Pro League', count: 155, home: 'Al Najma Unaizah', away: 'Al Nassr FC', time: 'Thursday, 26 February 2026', bg: 'bg-gradient-to-r from-[#2B1736] to-[#122F43]', odds: ['+ 2/2.5 1.05', '- 2/2.5 0.85'] },
];

const LATEST_BETS = [
  { game: 'Fortune Tiger', player: 'us***34', bet: '50,000', multi: '12.5x', profit: '+625,000', win: true },
  { game: 'Sweet Bonanza', player: 'ki***09', bet: '100,000', multi: '3.2x', profit: '+320,000', win: true },
  { game: 'Gates of Olympus', player: 'pa***77', bet: '200,000', multi: '0.0x', profit: '-200,000', win: false },
  { game: 'Pragmatic Roulette', player: 'ab***12', bet: '500,000', multi: '2.0x', profit: '+1,000,000', win: true },
  { game: 'Evolution Baccarat', player: 'zy***55', bet: '1,000,000', multi: '0.0x', profit: '-1,000,000', win: false },
  { game: 'Starlight Princess', player: 'mk***41', bet: '30,000', multi: '45.0x', profit: '+1,350,000', win: true },
  { game: 'Big Bass Bonanza', player: 'jh***88', bet: '80,000', multi: '8.7x', profit: '+696,000', win: true },
];

const NEWS_TABS = ['Default', 'About KZING', 'Special Bonus'];

const NEWS_ARTICLES: Record<string, { title: string; content: string }[]> = {
  'Default': [
    {
      title: 'A Complete Guide to Safe and Responsible Online Casino Betting',
      content: 'In the past decade, online casinos have become one of the fastest-growing entertainment industries in the world. With thousands of websites offering slot games, live dealers, and sports betting, players can now enjoy the thrill of the casino from the comfort of their homes. However, as the industry expands, so does the need for safety awareness, responsible betting, and platform transparency. Modern casino websites are powered by certified gaming software providers that ensure fairness through RNG (Random Number Generator) systems.',
    },
    {
      title: 'Top 5 Strategies for Maximizing Your Casino Winnings',
      content: 'Every experienced player knows that success in online gaming requires more than just luck. From bankroll management to understanding game mechanics, there are proven strategies that can help you make the most of your experience. Setting clear budgets, choosing games with favorable house edges, and taking advantage of promotional offers are key components of a winning approach.',
    },
  ],
  'About KZING': [
    {
      title: 'KZING: The Next Generation Online Gaming Platform',
      content: 'KZING represents a new era in online gaming with cutting-edge technology, seamless user experience, and an extensive game library featuring over 100 providers. Our platform is built on a foundation of trust, security, and innovation, offering players from around the world access to premium casino, sports, and live dealer experiences.',
    },
  ],
  'Special Bonus': [
    {
      title: 'Exclusive Welcome Bonus: Up to $20,000 for New Members',
      content: 'New to KZING? Take advantage of our incredible welcome bonus package worth up to $20,000. Your first deposit is matched 100% up to $5,000, and subsequent deposits receive bonus multipliers. Plus, enjoy free spins on selected slot games and exclusive VIP access from day one. Terms and conditions apply — minimum deposit required.',
    },
  ],
};

const PROVIDERS = [
  { name: 'Evolution', img: '/images/providers/evolution.webp' },
  { name: 'Pragmatic Play', img: '/images/providers/pragmatic_play.webp' },
  { name: 'PG Soft', img: '/images/providers/pg.webp' },
  { name: 'JILI', img: '/images/providers/jili.webp' },
  { name: 'Playtech', img: '/images/providers/playtech.webp' },
  { name: 'Spribe', img: '/images/providers/spribe.webp' },
  { name: 'Ezugi', img: '/images/providers/ezugi.webp' },
  { name: 'FC Slot', img: '/images/providers/fc_slot.webp' },
  { name: 'Kingmaker', img: '/images/providers/kingmaker.webp' },
  { name: 'BTI Sports', img: '/images/providers/bti.webp' },
  { name: 'SABA Sports', img: '/images/providers/saba.webp' },
  { name: 'IM', img: '/images/providers/im.webp' },
  { name: 'MWG', img: '/images/providers/mwg.webp' },
  { name: 'OG', img: '/images/providers/og.webp' },
  { name: 'Marble Magic', img: '/images/providers/marblemagic.webp' },
];

// -------------------- Page Component --------------------

export default function MainLobbyPage() {
  const { popularGames, fetchPopularGames } = useGameStore();
  const { isAuthenticated } = useAuthStore();
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [betTab, setBetTab] = useState<'latest' | 'highroller'>('latest');
  const [newsTab, setNewsTab] = useState('Default');
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchPopularGames();
      setIsLoading(false);
    };
    load();
  }, [fetchPopularGames]);

  const handlePlay = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  const handleDemo = useCallback((game: Game) => {
    setSelectedGame(game);
    setLaunchModalOpen(true);
  }, []);

  return (
    <div className="w-full pb-20 lg:pb-10 font-sans min-h-screen text-[#252531]">

      {/* 1. Announcement Marquee — matches Figma 22px height */}
      <div className="flex h-[22px] w-full items-center gap-2 overflow-hidden bg-[#f1f2f7] px-4">
        <div className="size-[20px] shrink-0 flex items-center justify-center">
          <Volume2 className="size-3.5 text-[#feb614]" />
        </div>
        <div className="relative flex-1 overflow-hidden" style={{ height: '22px' }}>
          <div className="animate-marquee-slow whitespace-nowrap absolute text-[13px] font-semibold leading-[22px] text-[#252531]">
            <span className="mr-8">{ANNOUNCEMENT_TEXT}</span>
            <span className="mr-8">{ANNOUNCEMENT_TEXT}</span>
            <span>{ANNOUNCEMENT_TEXT}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-300 px-4 lg:px-8 mt-4 lg:mt-6">

        {/* 3. Flagship CTA — KZ Original (kzkzb.com) */}
        <section
          className="flagship-signup relative mb-8 w-full overflow-hidden rounded-[14px] lg:mb-12"
          style={{
            height: 'clamp(320px, 40vw, 570px)',
            backgroundImage: 'url(/images/banners/signup_flagship.webp)',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '100% 50%',
            backgroundSize: 'contain',
            backgroundColor: '#f1f2f7',
          }}
        >
          <div className="relative z-10 flex h-full flex-col justify-center px-6 lg:px-12" style={{ maxWidth: '708px' }}>
            <h3 className="text-[20px] font-bold leading-snug text-[#252531] lg:text-[25px]">
              {isAuthenticated ? (
                <>DEPOSIT & <span className="text-[#feb614]">GET</span> BONUS<br />UP TO</>
              ) : (
                <>SIGN UP & <span className="text-[#feb614]">GET</span> REWARD<br />UP TO</>
              )}
            </h3>
            <h1
              className="mt-3 font-bold leading-none lg:mt-4"
              style={{
                fontSize: 'clamp(40px, 5vw, 70px)',
                fontFamily: 'ProximaNova, -apple-system, Inter, sans-serif',
                background: 'linear-gradient(90deg, #ffd651, #fe960e 60%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              $20,000.00
            </h1>
            <div className="mt-6 flex items-center gap-4 lg:mt-8">
              <Link
                href={isAuthenticated ? '/wallet/deposit' : '/register'}
                className="flex items-center justify-center text-[16px] font-bold capitalize text-[#252531] transition-all hover:brightness-110 lg:text-[18px]"
                style={{
                  width: '168px',
                  height: '55px',
                  borderRadius: '9px',
                  backgroundColor: '#feb614',
                  lineHeight: '55px',
                }}
              >
                {isAuthenticated ? 'Deposit Now' : 'Sign Up Now'}
              </Link>
              {!isAuthenticated && (
                <div className="flex items-center gap-2">
                  <span className="px-3 text-[16px] font-bold text-[#252531] lg:text-[18px]">or</span>
                  <a
                    href="#"
                    className="flex size-[32px] items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5"
                    style={{ border: '1px solid #f4b53e' }}
                  >
                    <Image src="/images/social/telegram.webp" alt="Telegram" width={22} height={22} />
                  </a>
                  <a
                    href="#"
                    className="flex size-[32px] items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5"
                    style={{ border: '1px solid #f4b53e' }}
                  >
                    <Image src="/images/social/google.webp" alt="Google" width={22} height={22} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 4. Promo Shortcut Cards */}
        <section className="mb-8 lg:mb-12">
          <div className="grid grid-cols-3 gap-3">
            {PROMO_SHORTCUTS.map((promo) => (
              <Link
                key={promo.name}
                href={promo.href}
                className="group flex flex-col items-center gap-2 rounded-[12px] bg-white p-4 border border-[#e8e8e8] transition-all hover:border-[#feb614]/40 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Image src={promo.icon} alt={promo.name} width={48} height={48} unoptimized className="transition-transform group-hover:scale-110" />
                <span className="text-[13px] font-bold text-[#252531]">{promo.name}</span>
                <span className="text-[11px] text-[#98a7b5]">{promo.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Recent Big Wins */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center gap-2.5">
            <div className="relative flex size-3 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#feb614] opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-[#feb614]"></span>
            </div>
            <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Recent Big Wins</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex w-max gap-3 pb-4">
              {RECENT_BIG_WINS.map((win, i) => (
                <div key={i} className="flex w-[124px] cursor-pointer flex-col overflow-hidden rounded-[12px] bg-white pb-3 shadow-sm border border-[#e8e8e8] transition-transform hover:-translate-y-1 hover:shadow-md">
                  <div className="relative aspect-square w-full overflow-hidden bg-[#f5f5f7]">
                    <Image src={win.img} alt={win.game} fill className="object-cover" sizes="124px" />
                  </div>
                  <div className="flex flex-col items-center px-2 pt-2 text-center">
                    <span className="line-clamp-1 w-full text-[11px] font-semibold text-[#6b7280]" title={win.game}>
                      {win.game}
                    </span>
                    <strong className="mt-1 flex items-center gap-1 text-[13px] font-black text-[#252531]">
                      {win.amount}
                      <span className="flex h-3.5 items-center justify-center rounded-full bg-[#26A17B] px-1.5 text-[8px] font-bold text-white">USDT</span>
                    </strong>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </section>

        {/* 6. Start Playing */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center gap-2.5">
            <Image src="/images/ui-icons/play_icon_2.webp" alt="Play" width={24} height={24} />
            <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Start Playing</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {START_PLAYING.map((item) => (
              <Link key={item.name} href={item.href} className="group relative flex h-[110px] items-center overflow-hidden rounded-[14px] bg-white p-3 shadow-sm border border-[#e8e8e8] transition-transform hover:-translate-y-1 hover:shadow-md">
                <div className="relative h-full w-[130px] shrink-0 overflow-hidden rounded-[10px]">
                  <Image src={item.img} alt={item.name} fill className="object-cover" sizes="130px" />
                </div>
                <div className="ml-4 flex flex-col justify-center">
                  <span className="text-[17px] font-bold text-[#252531]">{item.name}</span>
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#e8e8e8] px-3 py-1.5 text-[11px] font-semibold text-[#6b7280] transition-colors group-hover:border-[#feb614] group-hover:text-[#feb614]">
                    Go To {item.name} <span className="font-light">&gt;</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 7. Casino Game Grid */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/images/ui-icons/icon_casino.webp" alt="Casino" width={24} height={24} />
              <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Casino</h2>
            </div>
            <Link href="/games" className="text-[13px] font-semibold text-[#98a7b5] transition-colors hover:text-[#feb614]">
              View All &gt;
            </Link>
          </div>

          <div className="mb-5 flex flex-wrap gap-4">
            {CASINO_TABS.map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'text-[14px] font-semibold transition-all border-b-2 pb-1',
                  activeTab === i
                    ? 'text-[#252531] border-[#252531]'
                    : 'text-[#707070] border-transparent hover:text-[#252531]'
                )}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-[12px] bg-[#f5f5f7] aspect-[3/4] w-full" />
              ))}
            </div>
          ) : popularGames.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {popularGames.map((game) => (
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
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#e8e8e8] bg-[#f5f5f7] py-16">
              <Image src="/images/ui-icons/icon_dice.webp" alt="No games" width={48} height={48} className="opacity-50" />
              <p className="mt-3 text-sm font-semibold text-[#98a7b5]">No games available in this category.</p>
            </div>
          )}
        </section>

        {/* 8. Live Sports - keeps dark cards (sport cards are always dark themed) */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center gap-2.5">
            <Image src="/images/ui-icons/icon_sport.webp" alt="Sports" width={24} height={24} />
            <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Live Sports</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex w-max gap-3 pb-4">
              {LIVE_SPORTS.map((match, i) => (
                <div key={i} className={cn('relative flex h-[160px] w-[310px] flex-col rounded-[14px] p-4 text-white shadow-md transition-transform hover:-translate-y-1', match.bg)}>
                  <div className="flex items-start justify-between">
                    <span className="line-clamp-1 flex-1 text-[13px] font-bold tracking-wide text-[#EAEAEA]">{match.league}</span>
                    <div className="ml-2 shrink-0 rounded bg-black/20 px-2 py-0.5 text-[10px] font-bold text-[#FFD651]">
                      {match.count} &gt;
                    </div>
                  </div>
                  <div className="mt-3 flex flex-1 items-center justify-between px-2">
                    <div className="flex flex-col items-center gap-1.5 w-[80px]">
                      <div className="flex size-9 items-center justify-center rounded-full bg-white/10">
                        <Image src="/images/ui-icons/icon_sport.webp" alt="Home" width={20} height={20} />
                      </div>
                      <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{match.home}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[20px] font-black italic text-[#FFD651]">VS</span>
                      <span className="mt-1 text-[9px] font-medium opacity-80">{match.time}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 w-[80px]">
                      <div className="flex size-9 items-center justify-center rounded-full bg-white/10">
                        <Image src="/images/ui-icons/icon_sport.webp" alt="Away" width={20} height={20} />
                      </div>
                      <span className="line-clamp-2 text-center text-[11px] font-bold leading-tight">{match.away}</span>
                    </div>
                  </div>
                  <div className="mt-1 flex gap-2">
                    {match.odds.map((odd, idx) => (
                      <div key={idx} className="flex flex-1 items-center justify-center rounded border border-white/10 bg-black/30 py-1.5 text-[12px] font-bold text-[#FFD651]">
                        {odd}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </section>

        {/* 9. Latest Bet Table */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/images/ui-icons/betrecord_icon.webp" alt="Bets" width={24} height={24} />
              <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Latest Round &amp; Race</h2>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setBetTab('latest')}
                className={cn(
                  'text-[16px] font-semibold transition-all border-b-2 pb-1',
                  betTab === 'latest'
                    ? 'text-[#252531] border-[#252531]'
                    : 'text-[#707070] border-transparent hover:text-[#252531]'
                )}
              >
                Latest Bet
              </button>
              <button
                onClick={() => setBetTab('highroller')}
                className={cn(
                  'text-[16px] font-semibold transition-all border-b-2 pb-1',
                  betTab === 'highroller'
                    ? 'text-[#252531] border-[#252531]'
                    : 'text-[#707070] border-transparent hover:text-[#252531]'
                )}
              >
                High Roller
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-[12px] border border-[#e8e8e8] bg-white">
            <div className="grid grid-cols-5 gap-2 border-b border-[#dadde6] bg-white px-4 py-3 text-[14px] font-bold text-[#31373d]">
              <span>Event</span>
              <span>Player</span>
              <span className="text-right">Bet amount</span>
              <span className="text-right">Multiplier</span>
              <span className="text-right">Profit</span>
            </div>
            {LATEST_BETS.map((bet, i) => (
              <div
                key={i}
                className={cn(
                  'grid grid-cols-5 gap-2 px-4 py-3 text-[15px] transition-colors hover:bg-[#f5f5f7]/50 border-b border-[#dadde6]',
                  i % 2 === 0 ? 'bg-transparent' : 'bg-[#f9f9fb]'
                )}
              >
                <span className="truncate font-normal text-[#31373d]">{bet.game}</span>
                <span className="text-[#31373d]">{bet.player}</span>
                <span className="text-right font-semibold text-[#31373d]">{bet.bet}</span>
                <span className="text-right font-normal text-[#31373d]">{bet.multi}</span>
                <span className={cn('text-right font-normal', bet.win ? 'text-[#158718]' : 'text-[#ff4848]')}>
                  {bet.profit}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 10. News Section */}
        <section className="mb-8 lg:mb-12">
          <div className="mb-5 flex items-center gap-2.5">
            <Image src="/images/theme/news_icon.webp" alt="News" width={24} height={24} />
            <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">News</h2>
          </div>

          <div className="mb-5 flex gap-4">
            {NEWS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setNewsTab(tab)}
                className={cn(
                  'text-[14px] font-semibold transition-all border-b-2 pb-1',
                  newsTab === tab
                    ? 'text-[#252531] border-[#252531]'
                    : 'text-[#707070] border-transparent hover:text-[#252531]'
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {(NEWS_ARTICLES[newsTab] ?? []).map((article, i) => (
              <div
                key={i}
                className="rounded-[12px] border border-[#e8e8e8] bg-white p-5 transition-colors hover:border-[#feb614]/30"
              >
                <h3 className="mb-3 text-[15px] font-bold text-[#252531] leading-snug">
                  {article.title}
                </h3>
                <p className="text-[13px] leading-relaxed text-[#6b7280] line-clamp-3">
                  {article.content}
                </p>
                <button className="mt-4 inline-flex items-center gap-1 rounded-full border border-[#e8e8e8] px-4 py-1.5 text-[12px] font-semibold text-[#feb614] transition-colors hover:border-[#feb614] hover:bg-[#feb614]/10">
                  Read More <span className="text-[10px]">&gt;</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 11. Providers Carousel */}
        <section className="mb-10">
          <div className="mb-5 flex items-center gap-2.5">
            <Image src="/images/theme/provider_icon.webp" alt="Providers" width={24} height={24} />
            <h2 className="text-[18px] font-black text-[#252531] lg:text-[22px]">Providers</h2>
          </div>
          <ScrollArea className="w-full">
            <div className="flex w-max gap-3 pb-4">
              {PROVIDERS.map((provider) => (
                <div
                  key={provider.name}
                  className="flex h-[80px] w-[140px] shrink-0 flex-col items-center justify-center gap-2 rounded-[12px] bg-white border border-[#e8e8e8] transition-all hover:border-[#feb614]/40 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <Image src={provider.img} alt={provider.name} width={60} height={30} className="h-[30px] w-auto object-contain" />
                  <span className="text-[10px] font-semibold text-[#6b7280]">{provider.name}</span>
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </section>

      </div>

      <GameLaunchModal game={selectedGame} open={launchModalOpen} onOpenChange={setLaunchModalOpen} />
    </div>
  );
}
