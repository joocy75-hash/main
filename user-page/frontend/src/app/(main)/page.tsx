'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Volume2, Loader2, ChevronRight, Search, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useGameStore, type GameProvider, type Game } from '@/stores/game-store';
import { GameLaunchModal } from '@/components/game/game-launch-modal';
import { getProviderImage } from '@/lib/provider-images';

// -------------------- Constants --------------------

const ANNOUNCEMENT_TEXT = 'Welcome to Kzing — your ultimate destination for thrilling games, big wins, and nonstop entertainment!';

const PROMO_SHORTCUTS = [
  { name: 'Check-In', icon: '/images/theme/checkin_icon.gif', href: '/promotions/attendance', desc: 'Daily Bonus' },
  { name: 'Gift Bonus', icon: '/images/theme/gift_reward_icon.gif', href: '/promotions', desc: 'Claim Rewards' },
  { name: 'Lucky Spin', icon: '/images/theme/mission_icon.gif', href: '/promotions/spin', desc: 'Spin to Win' },
];

// Gradient palette for providers without logos — cycles through these
const CARD_GRADIENTS = [
  'linear-gradient(135deg, #1a0533 0%, #3d1259 50%, #5a1a80 100%)',
  'linear-gradient(135deg, #0a1628 0%, #132d5e 50%, #1e4488 100%)',
  'linear-gradient(135deg, #2d0a0a 0%, #6b1a1a 50%, #a12020 100%)',
  'linear-gradient(135deg, #0a2d1a 0%, #1a5e32 50%, #248844 100%)',
  'linear-gradient(135deg, #2d2d0a 0%, #5e5a1a 50%, #888024 100%)',
  'linear-gradient(135deg, #0a1a2d 0%, #1a3d6b 50%, #2060a1 100%)',
  'linear-gradient(135deg, #2d1a0a 0%, #6b3d1a 50%, #a16020 100%)',
  'linear-gradient(135deg, #1a0a2d 0%, #3d1a6b 50%, #6020a1 100%)',
  'linear-gradient(135deg, #0a2d2d 0%, #1a5e5e 50%, #248888 100%)',
  'linear-gradient(135deg, #2d0a1a 0%, #6b1a3d 50%, #a12060 100%)',
];

// -------------------- Sub-Components --------------------

function ProviderBannerCard({ provider, index }: { provider: GameProvider; index: number }) {
  const logoSrc = getProviderImage(provider.code, provider.name);
  const [imgError, setImgError] = useState(false);
  const showLogo = logoSrc && !imgError;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];

  return (
    <Link
      href={`/games?provider=${provider.code}`}
      className="group relative flex flex-col overflow-hidden rounded-[14px] transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ background: gradient, minHeight: '140px' }}
    >
      {/* Logo / Name Area */}
      {showLogo ? (
        <div className="flex items-center justify-center px-4 pt-4 pb-2" style={{ minHeight: '72px' }}>
          <Image
            src={logoSrc}
            alt={provider.name}
            width={160}
            height={56}
            className="object-contain drop-shadow-lg brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ maxHeight: '56px', width: 'auto' }}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center px-4 pt-4 pb-2" style={{ minHeight: '72px' }}>
          <span className="text-[18px] font-black text-white/90 drop-shadow-md text-center leading-tight lg:text-[20px]">
            {provider.name}
          </span>
        </div>
      )}

      {/* Info Footer */}
      <div className="relative z-10 mt-auto px-3 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {showLogo && (
              <h3 className="text-[12px] font-bold text-white/80 truncate">{provider.name}</h3>
            )}
            <p className="text-[11px] font-medium text-white/50">{provider.total} Games</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {provider.ko && (
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-bold text-[#feb614]">
                한국어
              </span>
            )}
            <ChevronRight className="size-3.5 text-white/40 transition-colors group-hover:text-[#feb614]" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {Array.from({ length: 21 }).map((_, i) => (
        <div key={i} className="h-[140px] animate-pulse rounded-[14px] bg-[#e8e8e8]" />
      ))}
    </div>
  );
}

// -------------------- Page Component --------------------

export default function MainLobbyPage() {
  const { isAuthenticated } = useAuthStore();
  const { providers, games, isLoading, fetchProvidersOnly } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProvidersOnly();
  }, [fetchProvidersOnly]);

  // Sort providers by total games desc, filter by search
  const displayProviders = useMemo(() => {
    let list = providers.filter((p) => p.total > 0);
    list.sort((a, b) => b.total - a.total);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
      );
    }

    return list;
  }, [providers, search]);

  return (
    <div className="w-full pb-20 lg:pb-10 font-sans min-h-screen text-[#252531]">

      {/* 1. Announcement Marquee */}
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

        {/* 2. Flagship CTA Banner */}
        <section
          className="flagship-signup relative mb-8 w-full overflow-hidden rounded-[14px] lg:mb-10"
          style={{
            height: 'clamp(280px, 35vw, 480px)',
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
                style={{ width: '168px', height: '55px', borderRadius: '9px', backgroundColor: '#feb614', lineHeight: '55px' }}
              >
                {isAuthenticated ? 'Deposit Now' : 'Sign Up Now'}
              </Link>
              {!isAuthenticated && (
                <div className="flex items-center gap-2">
                  <span className="px-3 text-[16px] font-bold text-[#252531] lg:text-[18px]">or</span>
                  <a href="#" className="flex size-[32px] items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5" style={{ border: '1px solid #f4b53e' }}>
                    <Image src="/images/social/telegram.webp" alt="Telegram" width={22} height={22} />
                  </a>
                  <a href="#" className="flex size-[32px] items-center justify-center rounded-full bg-white transition-transform hover:-translate-y-0.5" style={{ border: '1px solid #f4b53e' }}>
                    <Image src="/images/social/google.webp" alt="Google" width={22} height={22} />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3. Promo Shortcut Cards */}
        <section className="mb-8 lg:mb-10">
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

        {/* 4. Stats Bar */}
        {!isLoading && providers.length > 0 && (
          <section className="mb-8 lg:mb-10">
            <div className="flex items-center justify-center gap-6 rounded-[12px] bg-gradient-to-r from-[#252531] to-[#3d3d4f] px-6 py-4">
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-black text-[#feb614] lg:text-[28px]">{providers.length}</span>
                <span className="text-[11px] font-semibold text-white/60">프로바이더</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-black text-[#feb614] lg:text-[28px]">{games.length.toLocaleString()}</span>
                <span className="text-[11px] font-semibold text-white/60">전체 게임</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex flex-col items-center">
                <span className="text-[22px] font-black text-[#feb614] lg:text-[28px]">
                  {providers.filter((p) => p.ko).length}
                </span>
                <span className="text-[11px] font-semibold text-white/60">한국어 지원</span>
              </div>
            </div>
          </section>
        )}

        {/* 5. Provider Banner Grid — Section Header + Search */}
        <section className="mb-8 lg:mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-black text-[#252531] lg:text-[24px]">게임사</h2>
              <p className="text-[12px] text-[#98a7b5]">
                {displayProviders.length}개 프로바이더
                {search && ` (검색: "${search}")`}
              </p>
            </div>
            <Link
              href="/games"
              className="flex items-center gap-1 text-[13px] font-semibold text-[#feb614] hover:underline shrink-0"
            >
              전체 게임 <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#98a7b5]" />
            <input
              type="text"
              placeholder="프로바이더 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[10px] border border-[#e8e8e8] bg-[#f9fafb] py-2.5 pl-10 pr-10 text-[14px] text-[#252531] placeholder:text-[#b0b0b0] focus:border-[#feb614] focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#98a7b5] hover:text-[#252531]"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Provider Grid */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : displayProviders.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {displayProviders.map((provider, i) => (
                <ProviderBannerCard key={provider.code} provider={provider} index={i} />
              ))}
            </div>
          ) : providers.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-[36px]">🔍</span>
              <p className="mt-3 text-[14px] font-bold text-[#252531]">프로바이더를 찾을 수 없습니다</p>
              <p className="mt-1 text-[12px] text-[#98a7b5]">다른 검색어를 입력해보세요</p>
            </div>
          ) : null}
        </section>

        {/* Empty State — no providers loaded at all */}
        {!isLoading && providers.length === 0 && (
          <section className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-10 animate-spin text-[#98a7b5] mb-4" />
            <p className="text-[14px] text-[#98a7b5]">게임 프로바이더를 불러오고 있습니다...</p>
            <button
              onClick={() => fetchProvidersOnly()}
              className="mt-4 rounded-[10px] bg-[#feb614] px-6 py-2 text-[14px] font-bold text-[#252531] hover:brightness-110"
            >
              다시 시도
            </button>
          </section>
        )}

      </div>

      {/* Game Launch Modal */}
      <GameLaunchModal game={selectedGame} onClose={() => setSelectedGame(null)} />
    </div>
  );
}
