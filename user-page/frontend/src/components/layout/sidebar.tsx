'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

/* --- Types --- */

interface GameItem {
  name: string;
  href: string;
  icon: string;
  hasSubmenu?: boolean;
}

/* --- Bottom Nav Items (Figma sidebar bottom section) --- */

const BOTTOM_NAV_ITEMS: GameItem[] = [
  { name: 'Profile', href: '/profile', icon: '/images/theme/profile_icon.webp' },
  { name: 'Promotions', href: '/promotions', icon: '/images/theme/promotion_icon.webp' },
  { name: 'Sponsor', href: '/promotions/vip', icon: '/images/theme/sponsor_icon.webp' },
  { name: 'Affiliate', href: '/affiliate', icon: '/images/theme/affiliate_icon.webp' },
  { name: 'Live Support', href: '/support', icon: '/images/theme/cs_icon.webp' },
];

/* --- Game Category Items --- */

const GAME_ITEMS: GameItem[] = [
  { name: '라이브 카지노', href: '/games?category=casino', icon: '/images/category-icons/live_casino.webp', hasSubmenu: true },
  { name: '슬롯', href: '/games?category=slot', icon: '/images/category-icons/slots.webp', hasSubmenu: true },
  { name: '스프라이브', href: '/games?category=spribe', icon: '/images/providers/spribe.webp' },
  { name: '스포츠', href: '/sports', icon: '/images/category-icons/sports.webp', hasSubmenu: true },
  { name: '라이브스포츠', href: '/sports/live', icon: '/images/category-icons/sports.webp' },
  { name: 'E스포츠', href: '/esports', icon: '/images/category-icons/esports.webp' },
  { name: '홀덤', href: '/games?category=holdem', icon: '/images/category-icons/card_game.webp' },
  { name: '미니게임', href: '/minigame', icon: '/images/category-icons/marble.webp' },
  { name: '가상게임', href: '/games?category=virtual', icon: '/images/category-icons/arcade.webp' },
];

/* --- Sidebar Component --- */

export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');

  let fullUrl = pathname;
  if (category) {
    fullUrl = `${pathname}?category=${category}`;
  } else if (sort) {
    fullUrl = `${pathname}?sort=${sort}`;
  }

  const isActive = (href: string) => {
    if (href.includes('?')) return fullUrl === href;
    if (href === '/games') return pathname === '/games' && !category && !sort;
    if (href === '/sports') return pathname === '/sports';
    return pathname.startsWith(href) && href !== '/';
  };

  const isHomeActive = pathname === '/';

  return (
    <aside
      className={cn(
        'w-[270px] shrink-0 bg-white border-r border-[#e8e8e8]',
        className
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto w-full no-scrollbar px-3 pt-3">

        {/* --- Home Button --- */}
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 rounded-[6px] px-4 py-2.5 text-[15px] font-bold transition-all relative',
              isHomeActive
                ? 'bg-[#edeef3] text-[#31373d]'
                : 'text-[#707070] hover:bg-[#edeef3] hover:text-[#31373d]'
            )}
          >
            {isHomeActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-[#feb614] rounded-r" />
            )}
            <Image
              src={isHomeActive ? '/images/ui-icons/icon_home_v2_filled.webp' : '/images/ui-icons/icon_home_v2.webp'}
              alt="Home"
              width={20}
              height={20}
              className={cn(isHomeActive ? 'opacity-100' : 'opacity-60')}
            />
            Home
          </Link>

        {/* --- Promo Shortcut Cards --- */}
        <div className="pb-2 flex flex-col gap-[6px] mt-2 px-1">
          {/* Top Row: 2 Columns */}
          <div className="grid grid-cols-2 gap-[6px]">
            <Link
              href="/promotions/attendance"
              className="group relative h-[42px] overflow-hidden rounded-[8px] p-2 flex items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.15)]"
              style={{ backgroundColor: '#2d3367' }}
            >
              <div className="flex items-center gap-1.5 relative z-10 w-full justify-center text-left">
                <Image
                  src="/images/theme/checkin_icon.gif"
                  alt="Check-In"
                  width={22}
                  height={22}
                  unoptimized
                  className="shrink-0 drop-shadow-sm"
                />
                <span className="text-[11px] font-black text-white tracking-tight leading-[13px] drop-shadow-sm">
                  Check-In<br />Bonus
                </span>
              </div>
            </Link>

            <Link
              href="/promotions"
              className="group relative h-[42px] overflow-hidden rounded-[8px] p-2 flex items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: '#d90a88' }}
            >
              <div className="flex items-center gap-1.5 relative z-10 w-full justify-center text-left">
                <Image
                  src="/images/theme/gift_reward_icon.gif"
                  alt="Gifts"
                  width={22}
                  height={22}
                  unoptimized
                  className="shrink-0 drop-shadow-sm"
                />
                <span className="text-[11px] font-black text-white tracking-tight leading-[13px] drop-shadow-sm">
                  Gifts<br />Reward
                </span>
              </div>
            </Link>
          </div>

          {/* Bottom Row: 4 Columns */}
          <div className="grid grid-cols-4 gap-[6px]">
            <Link
              href="/promotions/vip"
              className="group relative h-[48px] overflow-hidden rounded-[8px] flex flex-col items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: '#3ca862' }}
            >
              <div className="drop-shadow-sm mb-[1px]">
                <Image
                  src="/images/theme/vip_icon.gif"
                  alt="VIP"
                  width={22}
                  height={22}
                  unoptimized
                />
              </div>
              <span className="text-[9px] font-black text-white drop-shadow-sm">VIP</span>
            </Link>

            <Link
              href="/promotions/spin"
              className="group relative h-[48px] overflow-hidden rounded-[8px] flex flex-col items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: '#2f94dd' }}
            >
              <div className="drop-shadow-sm mb-[1px]">
                <Image
                  src="/images/ui-icons/icon_dice.webp"
                  alt="Roulette"
                  width={22}
                  height={22}
                />
              </div>
              <span className="text-[9px] font-black text-white drop-shadow-sm">Roulette</span>
            </Link>

            <Link
              href="/promotions/missions"
              className="group relative h-[48px] overflow-hidden rounded-[8px] flex flex-col items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.15)]"
              style={{ backgroundColor: '#181e36' }}
            >
              <div className="drop-shadow-sm mb-[1px]">
                <Image
                  src="/images/theme/mission_icon.gif"
                  alt="Quest Hub"
                  width={22}
                  height={22}
                  unoptimized
                />
              </div>
              <span className="text-[10px] font-black text-white drop-shadow-sm text-center leading-[10px] tracking-tighter w-full block">Quest Hub</span>
            </Link>

            <Link
              href="/affiliate"
              className="group relative h-[48px] overflow-hidden rounded-[8px] flex flex-col items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_2px_4px_rgba(0,0,0,0.1),_inset_0_-2px_0_rgba(0,0,0,0.2),_inset_0_2px_3px_rgba(255,255,255,0.2)]"
              style={{ backgroundColor: '#e28810' }}
            >
              <div className="drop-shadow-sm mb-[1px]">
                <Image
                  src="/images/ui-icons/recommend.webp"
                  alt="Referral"
                  width={22}
                  height={22}
                />
              </div>
              <span className="text-[9px] font-black text-white drop-shadow-sm">Referral</span>
            </Link>
          </div>
        </div>

        {/* --- Promotion Banner --- */}
        <div className="pb-4 pt-1 px-1">
          <Link
            href="/promotions"
            className="group relative h-[44px] w-full overflow-hidden rounded-[8px] flex items-center justify-center transform transition-transform hover:-translate-y-[1px] shadow-[0_3px_6px_rgba(0,0,0,0.15),_inset_0_-3px_0_rgba(220,120,10,0.5),_inset_0_3px_4px_rgba(255,255,255,0.4)]"
            style={{ background: 'linear-gradient(180deg, #fed452 0%, #fab130 50%, #f69824 100%)' }}
          >
            {/* Glossy angled shine effect that matches the screenshot exactly */}
            <div className="absolute top-0 right-[40%] w-[100px] h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 skew-x-[-20deg] pointer-events-none group-hover:translate-x-full transition-transform duration-700" />
            
            <span
              className="text-[23px] font-black italic tracking-wider text-white relative z-10"
              style={{ 
                WebkitTextStroke: '0.5px #b65f04',
                textShadow: '2px 2px 0px #cf6d02, -1px -1px 0 #b65f04, 1px -1px 0px #b65f04, 0px 3px 2px rgba(182,95,4,0.6)' 
              }}
            >
              PROMOTION
            </span>
          </Link>
        </div>

        {/* --- Divider --- */}
        <div className="mx-4 h-px bg-[#d4d4d6] mb-2" />

        {/* --- Game Category List --- */}
        <nav className="flex flex-col px-3">
          {GAME_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[14px] font-bold transition-all relative',
                  active
                    ? 'bg-[#edeef3] text-[#31373d]'
                    : 'text-[#707070] hover:bg-[#edeef3] hover:text-[#31373d]'
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-[#feb614] rounded-r" />
                )}
                <div className="flex w-6 justify-center items-center">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={24}
                    height={24}
                    className={cn(
                      'transition-opacity',
                      active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                    )}
                  />
                </div>
                <span className="flex-1">{item.name}</span>
                {item.hasSubmenu && (
                  <span className="text-[10px] text-[#b0b0b0] group-hover:text-[#98a7b5]">▶</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* --- Divider --- */}
        <div className="mx-6 my-2 h-px bg-[#d4d4d6]" />

        {/* --- Bottom Nav Links (Figma: Profile, Promotions, Sponsor, Affiliate, Live Support) --- */}
        <nav className="flex flex-col px-3 pb-2">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-[6px] px-3 py-2.5 text-[14px] font-bold transition-all relative',
                  active
                    ? 'bg-[#edeef3] text-[#31373d]'
                    : 'text-[#707070] hover:bg-[#edeef3] hover:text-[#31373d]'
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.75 h-5 bg-[#feb614] rounded-r" />
                )}
                <div className="flex w-6 justify-center items-center">
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={24}
                    height={24}
                    className={cn(
                      'transition-opacity',
                      active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                    )}
                  />
                </div>
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* --- Light / Dark Toggle (Figma) --- */}
        <div className="mx-3 mb-4 flex rounded-[6px] bg-[#f1f2f7] overflow-hidden">
          <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5 bg-white rounded-[6px] cursor-pointer">
            <Image src="/images/theme/theme_light.webp" alt="Light" width={17} height={17} />
            <span className="text-[14px] font-bold text-[#252531]">Light</span>
          </div>
          <div className="flex flex-1 items-center justify-center gap-1.5 py-2.5 cursor-pointer">
            <Image src="/images/theme/theme_dark.webp" alt="Dark" width={17} height={17} />
            <span className="text-[14px] font-bold text-[#ccc3c3]">Dark</span>
          </div>
        </div>

      </div>
    </aside>
  );
};
