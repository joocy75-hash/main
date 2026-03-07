"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Volume2, Loader2, ChevronRight, Search, X,
  Gamepad2, MonitorPlay, Blocks, Rocket, 
  Spade, Gamepad, Trophy, Dices, Zap 
} from "lucide-react";
import {
  useGameStore,
  type GameProvider,
  type Game,
} from "@/stores/game-store";
import { useAuthStore } from "@/stores/auth-store";
import { GameLaunchModal } from "@/components/game/game-launch-modal";
import { getProviderImage } from "@/lib/provider-images";

// -------------------- Constants --------------------

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

const ANNOUNCEMENT_TEXT =
  "Welcome to Kzing — your ultimate destination for thrilling games, big wins, and nonstop entertainment!";

const PROMO_SHORTCUTS = [
  {
    name: "Check-In",
    icon: "/images/theme/checkin_icon.gif",
    href: "/promotions/attendance",
    desc: "Daily Bonus",
  },
  {
    name: "Gift Bonus",
    icon: "/images/theme/gift_reward_icon.gif",
    href: "/promotions",
    desc: "Claim Rewards",
  },
  {
    name: "Lucky Spin",
    icon: "/images/theme/mission_icon.gif",
    href: "/promotions/spin",
    desc: "Spin to Win",
  },
];

// Gradient palette for providers without logos — cycles through these
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #1a0533 0%, #3d1259 50%, #5a1a80 100%)",
  "linear-gradient(135deg, #0a1628 0%, #132d5e 50%, #1e4488 100%)",
  "linear-gradient(135deg, #2d0a0a 0%, #6b1a1a 50%, #a12020 100%)",
  "linear-gradient(135deg, #0a2d1a 0%, #1a5e32 50%, #248844 100%)",
  "linear-gradient(135deg, #2d2d0a 0%, #5e5a1a 50%, #888024 100%)",
  "linear-gradient(135deg, #0a1a2d 0%, #1a3d6b 50%, #2060a1 100%)",
  "linear-gradient(135deg, #2d1a0a 0%, #6b3d1a 50%, #a16020 100%)",
  "linear-gradient(135deg, #1a0a2d 0%, #3d1a6b 50%, #6020a1 100%)",
  "linear-gradient(135deg, #0a2d2d 0%, #1a5e5e 50%, #248888 100%)",
  "linear-gradient(135deg, #2d0a1a 0%, #6b1a3d 50%, #a12060 100%)",
];

// -------------------- Sub-Components --------------------

const PROMO_SLIDES = [
  {
    src: "/images/banners/promo_slide_1.webp",
    alt: "Promotion 1",
    href: "/promotions",
  },
  {
    src: "/images/banners/promo_slide_2.webp",
    alt: "Promotion 2",
    href: "/promotions",
  },
  {
    src: "/images/banners/promo_slide_3.webp",
    alt: "Promotion 3",
    href: "/promotions",
  },
];

function PromoBannerSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setCurrent((c) => (c + 1) % PROMO_SLIDES.length),
      5000,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="mb-8 lg:mb-10 relative z-10">
      {/* Desktop: 3 banners side-by-side */}
      <div className="hidden lg:grid lg:grid-cols-3 lg:gap-[20px]">
        {PROMO_SLIDES.map((slide) => (
          <Link
            key={slide.src}
            href={slide.href}
            className="block overflow-hidden rounded-[16px] transition-transform hover:-translate-y-1 hover:shadow-lg"
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="h-auto w-full object-cover"
              draggable={false}
            />
          </Link>
        ))}
      </div>
      {/* Mobile: single slide with dots */}
      <div className="lg:hidden">
        <Link
          href={PROMO_SLIDES[current].href}
          className="block overflow-hidden rounded-[9px]"
        >
          <img
            src={PROMO_SLIDES[current].src}
            alt={PROMO_SLIDES[current].alt}
            className="h-auto w-full object-cover"
            draggable={false}
          />
        </Link>
        <div className="mt-2 flex justify-center gap-1.5">
          {PROMO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-[6px] rounded-full transition-all ${i === current ? "w-5 bg-[#feb614]" : "w-[6px] bg-[#d1d5db]"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlagshipBanner() {
  const { isAuthenticated } = useAuthStore();

  return (
    <section className="mb-0 relative z-30">
      <div className="relative rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e2e8f0]">
        {/* Players Image - Extremely Enlarged & Merging with cards below */}
        <div className="absolute right-[0%] bottom-[-28%] w-[115%] pr-2 md:right-[1%] md:bottom-[-24%] md:w-[90%] md:pr-4 lg:right-[2%] lg:bottom-[-22%] lg:w-[74%] lg:pr-6 pointer-events-none z-10 drop-shadow-2xl translate-y-4">
          <img 
            src="/images/banners/signup_flagship.webp" 
            alt="Flagship Players" 
            className="w-full h-auto object-contain" 
            draggable={false}
          />
        </div>
        {/* Desktop: full height */}
        <div className="hidden lg:block relative z-20" style={{ height: "420px" }}>
          <div
            className="flex flex-col justify-start"
            style={{ paddingTop: "65px", paddingLeft: "50px" }}
          >
            <h3 className="text-[32px] font-bold leading-[1.1] text-[#252531]">
              SIGN UP & <span className="text-[#feb614]">GET</span> REWARD
              <br />
              UP TO
            </h3>
            <h1
              className="mt-[10px] text-[70px] font-[700] leading-none tracking-[-0.02em]"
              style={{
                background: "linear-gradient(90deg, #ffd651 0%, #fe960e 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              $20,000.00
            </h1>
            <div className="mt-[28px] flex items-center">
              <Link
                href={isAuthenticated ? "/wallet/deposit" : "/register"}
                className="flex items-center justify-center rounded-[9px] bg-[#feb614] text-[18px] font-[700] capitalize text-[#252531] transition-all hover:brightness-110 shadow-md shadow-[#feb614]/20"
                style={{ width: "168px", height: "55px", lineHeight: "55px" }}
              >
                {isAuthenticated ? "Deposit Now" : "Sign Up Now"}
              </Link>
              <span className="px-[12px] text-[18px] font-[700] text-[#252531]">
                or
              </span>
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  className="flex size-[38px] items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110 border border-gray-100"
                >
                  <Image
                    src="/images/theme/icon_telegram.webp"
                    alt="Telegram"
                    width={22}
                    height={22}
                    unoptimized
                    className="align-middle"
                  />
                </a>
                <a
                  href="#"
                  className="flex size-[38px] items-center justify-center rounded-full bg-white shadow-sm transition-transform hover:scale-110 border border-gray-100"
                >
                  <Image
                    src="/images/theme/icon_google.webp"
                    alt="Google"
                    width={22}
                    height={22}
                    unoptimized
                    className="align-middle"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile: compact */}
        <div className="lg:hidden relative z-20" style={{ minHeight: "220px" }}>
          <div className="flex flex-col justify-start px-5 py-8">
            <h3 className="text-[18px] font-bold leading-[1.1] text-[#252531]">
              SIGN UP & <span className="text-[#feb614]">GET</span> REWARD
              <br />
              UP TO
            </h3>
            <h1
              className="mt-2 text-[42px] font-bold leading-none tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ffd651 0%, #fe960e 60%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              $20,000.00
            </h1>
            <div className="mt-5 flex items-center">
              <Link
                href={isAuthenticated ? "/wallet/deposit" : "/register"}
                className="flex items-center justify-center rounded-[10px] bg-[#feb614] px-5 py-2.5 text-[14px] font-bold capitalize text-[#252531] transition-all hover:brightness-110 shadow-sm"
              >
                {isAuthenticated ? "Deposit Now" : "Sign Up Now"}
              </Link>
              <span className="px-3 text-[14px] font-bold text-[#252531]">
                or
              </span>
              <div className="flex items-center gap-2">
                <a
                  href="#"
                  className="flex size-[28px] items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
                >
                  <Image
                    src="/images/theme/icon_telegram.webp"
                    alt="Telegram"
                    width={16}
                    height={16}
                    unoptimized
                  />
                </a>
                <a
                  href="#"
                  className="flex size-[28px] items-center justify-center rounded-full bg-white shadow-sm border border-gray-100"
                >
                  <Image
                    src="/images/theme/icon_google.webp"
                    alt="Google"
                    width={16}
                    height={16}
                    unoptimized
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProviderBannerCard({
  provider,
  index,
  categoryId,
}: {
  provider: GameProvider;
  index: number;
  categoryId?: string;
}) {
  const logoSrc = getProviderImage(
    provider.code,
    provider.name,
    provider.image,
  );
  const [imgError, setImgError] = useState(false);
  const showLogo = logoSrc && !imgError;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const count = categoryId && categoryId !== 'all' ? (provider.categories[categoryId] || 0) : provider.total;

  return (
    <Link
      href={categoryId && categoryId !== 'all' ? `/games?category=${categoryId}&provider=${provider.code}` : `/games?provider=${provider.code}`}
      className="group relative flex flex-col overflow-hidden rounded-[14px] transition-all hover:-translate-y-1 hover:shadow-xl"
      style={{ background: gradient, minHeight: "140px" }}
    >
      {/* Logo / Name Area */}
      {showLogo ? (
        <div
          className="flex items-center justify-center px-4 pt-4 pb-2"
          style={{ minHeight: "72px" }}
        >
          <Image
            src={logoSrc}
            alt={provider.name}
            width={160}
            height={56}
            className="object-contain drop-shadow-lg brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
            style={{ maxHeight: "56px", width: "auto" }}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center px-4 pt-4 pb-2"
          style={{ minHeight: "72px" }}
        >
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
              <h3 className="text-[12px] font-bold text-white/80 truncate">
                {provider.name}
              </h3>
            )}
            <p className="text-[11px] font-medium text-white/50">
              {count} Games
            </p>
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
        <div
          key={i}
          className="h-[140px] animate-pulse rounded-[14px] bg-[#e8e8e8]"
        />
      ))}
    </div>
  );
}

// -------------------- Page Component --------------------

export default function MainLobbyPage() {
  const { providers, isLoading, fetchProvidersOnly } = useGameStore();
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchProvidersOnly();
  }, [fetchProvidersOnly]);

  // Sort providers by total games desc, filter by search and category
  const displayProviders = useMemo(() => {
    let list = providers.filter((p) => p.total > 0);

    // Filter by category
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.categories[selectedCategory] > 0);
    }

    // Sort heavily by the selected category count
    list.sort((a, b) => {
      const aCount = selectedCategory === "all" ? a.total : a.categories[selectedCategory];
      const bCount = selectedCategory === "all" ? b.total : b.categories[selectedCategory];
      return bCount - aCount;
    });

    // Sub-filter by search keyword
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q),
      );
    }

    return list;
  }, [providers, search, selectedCategory]);

  return (
    <div className="w-full pb-20 lg:pb-10 font-sans min-h-screen text-[#252531]">
      {/* 1. Announcement Marquee */}
      <div className="flex h-[40px] w-full items-center gap-3 overflow-hidden bg-[#f1f2f7] px-6">
        <div className="shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-[20px] h-[20px] fill-[#252531]">
            <path d="M12.98 3.22c-.35-.2-.79-.16-1.09.1l-4.89 4.18H4c-1.1 0-2 .9-2 2v5c0 1.1.9 2 2 2h3l4.89 4.18c.17.15.39.23.61.22.17.01.33-.04.48-.12.33-.19.53-.53.52-.89v-15.78c.01-.36-.19-.7-.52-.89zM16.89 15.42c-.24.18-.57.12-.75-.12-.18-.24-.12-.57.12-.75 1.12-.83 1.74-1.63 1.74-2.55 0-.92-.62-1.72-1.74-2.55-.24-.18-.3-.51-.12-.75.18-.24.51-.3.75-.12 1.34.98 2.11 2.08 2.11 3.42 0 1.34-.77 2.44-2.11 3.42zM19.16 18.06c-.25.16-.59.09-.74-.16-.16-.25-.09-.59.16-.74 1.77-1.16 2.92-3.01 2.92-5.16 0-2.15-1.15-4-2.92-5.16-.25-.15-.32-.49-.16-.74.15-.25.49-.32.74-.16 1.98 1.31 3.34 3.49 3.34 6.06 0 2.57-1.36 4.75-3.34 6.06z" />
          </svg>
        </div>
        <div
          className="relative flex-1 overflow-hidden"
          style={{ height: "40px" }}
        >
          <div className="animate-marquee-slow whitespace-nowrap absolute text-[18px] font-[600] leading-[40px] text-[#252531]">
            <span className="mr-12">{ANNOUNCEMENT_TEXT}</span>
            <span className="mr-12">{ANNOUNCEMENT_TEXT}</span>
            <span>{ANNOUNCEMENT_TEXT}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-300 px-4 lg:px-8 mt-4 lg:mt-6">
        {/* 2. Flagship CTA Banner */}
        <FlagshipBanner />

        {/* 3. Promo Banner Slider */}
        <PromoBannerSlider />

        {/* 4. Promo Shortcut Cards */}
        <section className="mb-8 lg:mb-10">
          <div className="grid grid-cols-3 gap-3">
            {PROMO_SHORTCUTS.map((promo) => (
              <Link
                key={promo.name}
                href={promo.href}
                className="group flex flex-col items-center gap-2 rounded-[12px] bg-white p-4 border border-[#e8e8e8] transition-all hover:border-[#feb614]/40 hover:-translate-y-0.5 hover:shadow-md"
              >
                <Image
                  src={promo.icon}
                  alt={promo.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="transition-transform group-hover:scale-110"
                />
                <span className="text-[13px] font-bold text-[#252531]">
                  {promo.name}
                </span>
                <span className="text-[11px] text-[#98a7b5]">{promo.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Removed Stats Bar */}

        {/* 6. Provider Banner Grid — Section Header + Tabs + Search */}
        <section className="mb-8 lg:mb-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[20px] font-black text-[#252531] lg:text-[24px]">
                게임사
              </h2>
              <p className="text-[12px] text-[#98a7b5]">
                {selectedCategory === "all" ? "모든 게임사" : CATEGORIES.find(c => c.id === selectedCategory)?.name + " 제공 게임사"} {displayProviders.length}개
                {search && ` (검색: "${search}")`}
              </p>
            </div>
            <Link
              href={selectedCategory === "all" ? "/games" : `/games?category=${selectedCategory}`}
              className="flex items-center gap-1 text-[13px] font-semibold text-[#feb614] hover:underline shrink-0"
            >
              게임 보러가기 <ChevronRight className="size-3.5" />
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="mb-5 flex gap-2.5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 lg:mx-0 lg:px-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex shrink-0 items-center justify-center gap-2 h-[42px] px-4 rounded-xl font-black text-[14px] transform hover:-translate-y-0.5 transition-all outline-none ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white shadow-[0_4px_10px_rgba(30,106,219,0.3),_inset_0_2px_0_rgba(255,255,255,0.3)] border-none'
                    : 'bg-gradient-to-b from-white to-[#f8fafc] text-[#64748b] border border-[#e2e8f0] shadow-[0_2px_4px_rgba(0,0,0,0.02),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:text-[#1e293b] hover:border-[#cbd5e1]'
                }`}
              >
                <span className={`text-[17px] ${selectedCategory === cat.id ? 'text-white drop-shadow-sm' : 'text-[#94a3b8]'}`}>
                  {cat.icon}
                </span> 
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-5 group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-[14px] blur-md opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
            <div className="relative flex items-center">
              <Search className="absolute left-4 size-[18px] text-[#94a3b8] group-focus-within:text-[#3b82f6] transition-colors" strokeWidth={2.5} />
              <input
                type="text"
                placeholder="찾고 싶은 게임사(프로바이더) 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[48px] rounded-[14px] border border-[#cbd5e1] bg-[#fbfcfd] py-2 pl-11 pr-10 text-[15px] font-bold text-[#1e293b] placeholder:text-[#94a3b8] placeholder:font-bold focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 focus:bg-white focus:outline-none transition-all shadow-inner"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-4 text-[#94a3b8] hover:text-[#ef4444] hover:scale-110 transition-all"
                >
                  <X className="size-5" strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>

          {/* Provider Grid */}
          {isLoading ? (
            <LoadingSkeleton />
          ) : displayProviders.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
              {displayProviders.map((provider, i) => (
                <ProviderBannerCard
                  key={provider.code + selectedCategory}
                  provider={provider}
                  index={i}
                  categoryId={selectedCategory}
                />
              ))}
            </div>
          ) : providers.length > 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <span className="text-[36px]">🔍</span>
              <p className="mt-3 text-[14px] font-bold text-[#252531]">
                프로바이더를 찾을 수 없습니다
              </p>
              <p className="mt-1 text-[12px] text-[#98a7b5]">
                다른 검색어를 입력해보세요
              </p>
            </div>
          ) : null}
        </section>

        {/* Empty State — no providers loaded at all */}
        {!isLoading && providers.length === 0 && (
          <section className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-10 animate-spin text-[#98a7b5] mb-4" />
            <p className="text-[14px] text-[#98a7b5]">
              게임 프로바이더를 불러오고 있습니다...
            </p>
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
      <GameLaunchModal
        game={selectedGame}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
