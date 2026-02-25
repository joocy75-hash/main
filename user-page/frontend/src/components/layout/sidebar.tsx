'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface GameItem {
  name: string;
  href: string;
  icon: string;
  hasSubmenu?: boolean;
}

// Matches kzkzb.com sidebar exactly: 13 game categories
const GAME_ITEMS: GameItem[] = [
  { name: 'Local Games', href: '/games', icon: '🏠', hasSubmenu: true },
  { name: 'New Releases', href: '/games?sort=new', icon: '🆕' },
  { name: 'Hot Games', href: '/games?sort=hot', icon: '🔥' },
  { name: 'Slots', href: '/games?category=slot', icon: '🎰' },
  { name: 'Live Casino', href: '/games?category=casino', icon: '🎲', hasSubmenu: true },
  { name: 'Sports', href: '/sports', icon: '⚽', hasSubmenu: true },
  { name: 'Fishing', href: '/games?category=shooting', icon: '🐟' },
  { name: 'Card Game', href: '/games?category=holdem', icon: '🃏' },
  { name: 'Lottery', href: '/games?category=coin', icon: '🎫' },
  { name: 'ESports', href: '/esports', icon: '🎮' },
  { name: '3D', href: '/games?category=mini_game', icon: '🎯' },
  { name: 'Arcade', href: '/games?sort=arcade', icon: '👾' },
  { name: 'Marble', href: '/minigame', icon: '🔮' },
];

// Promo shortcuts: 2-col top + 3-col bottom (kzkzb exact layout)
const PROMO_TOP = [
  { name: '출석 보너스', href: '/promotions/attendance', gradient: 'from-teal-500 to-emerald-600' },
  { name: '선물 보상', href: '/promotions', gradient: 'from-rose-500 to-pink-600' },
];

const PROMO_BOTTOM = [
  { name: 'VIP', href: '/promotions/vip', gradient: 'from-amber-500 to-orange-500' },
  { name: '럭키스핀', href: '/promotions/spin', gradient: 'from-violet-500 to-purple-600' },
  { name: '미션', href: '/promotions/missions', gradient: 'from-sky-500 to-blue-600' },
];

export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const fullUrl = category ? `${pathname}?category=${category}` : sort ? `${pathname}?sort=${sort}` : pathname;

  const isActive = (href: string) => {
    if (href.includes('?')) return fullUrl === href;
    if (href === '/games') return pathname === '/games' && !category && !sort;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'w-[240px] shrink-0 bg-[#252531]',
        className
      )}
    >
      <div className="flex h-full flex-col overflow-y-auto">
        {/* Home active tab */}
        <div className="px-3 pt-3 pb-2">
          <Link
            href="/"
            className={cn(
              'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all',
              pathname === '/'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            )}
          >
            <span className="text-base">🏠</span>
            Home
          </Link>
        </div>

        {/* Promo shortcut cards - 2+3 grid */}
        <div className="px-3 pb-2">
          <div className="grid grid-cols-2 gap-1.5">
            {PROMO_TOP.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-center rounded-lg bg-gradient-to-r px-2 py-2.5 text-[11px] font-bold text-white shadow-sm transition-transform hover:scale-[1.02]',
                  item.gradient
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {PROMO_BOTTOM.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center justify-center rounded-lg bg-gradient-to-r px-1.5 py-2.5 text-[10px] font-bold text-white shadow-sm transition-transform hover:scale-[1.02]',
                  item.gradient
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Promotion banner */}
        <div className="px-3 pb-2">
          <Link
            href="/promotions"
            className="block overflow-hidden rounded-lg bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 px-4 py-2.5 text-center text-sm font-extrabold tracking-wide text-white shadow-sm transition-transform hover:scale-[1.01]"
          >
            🎉 Promotion
          </Link>
        </div>

        {/* Game categories - matches kzkzb 13 items */}
        <nav className="flex flex-col border-t border-white/10 px-2 pt-1">
          {GAME_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all',
                  active
                    ? 'bg-[#f4b53e]/15 font-medium text-[#f4b53e]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <span className="w-5 text-center text-base leading-none">{item.icon}</span>
                <span className="flex-1">{item.name}</span>
                {item.hasSubmenu && (
                  <span className="text-xs text-white/40">›</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
