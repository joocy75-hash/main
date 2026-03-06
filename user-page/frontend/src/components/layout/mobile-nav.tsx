'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  {
    name: 'Menu',
    href: '/games',
    icon: '/images/ui-icons/menu_icon.webp',
    activeIcon: '/images/ui-icons/menu_icon.webp',
  },
  {
    name: 'Home',
    href: '/',
    icon: '/images/ui-icons/icon_home_v2.webp',
    activeIcon: '/images/ui-icons/icon_home_v2_filled.webp',
  },
  {
    name: 'Affiliate',
    href: '/affiliate',
    icon: '/images/ui-icons/recommend.webp',
    activeIcon: '/images/ui-icons/recommend.webp',
  },
  {
    name: 'Bet History',
    href: '/profile/bets',
    icon: '/images/ui-icons/betrecord_icon.webp',
    activeIcon: '/images/ui-icons/betrecord_icon.webp',
  },
  {
    name: 'My',
    href: '/profile',
    icon: '/images/ui-icons/my_icon.webp',
    activeIcon: '/images/ui-icons/my_icon.webp',
  },
] as const;

export const MobileNav = ({ className }: { className?: string }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '';
    if (href === '/profile' && pathname === '/profile') return true;
    if (href === '/profile') return false;
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)]',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="flex h-[60px] items-center justify-around px-2">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const iconSrc = active ? tab.activeIcon : tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                active ? 'text-[#feb614]' : 'text-[#707070]'
              )}
            >
              <Image
                src={iconSrc}
                alt={tab.name}
                width={22}
                height={22}
                className={cn(
                  'object-contain',
                  active ? 'brightness-100' : 'brightness-75 opacity-60'
                )}
              />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
