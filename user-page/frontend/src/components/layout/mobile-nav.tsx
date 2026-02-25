'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Menu, Handshake, ListOrdered, User } from 'lucide-react';
import { cn } from '@/lib/utils';

// Matches kzkzb.com mobile bottom tab: Menu / Home / Affiliate / Bet History / My
const TABS = [
  { name: 'Menu', href: '/games', icon: Menu },
  { name: 'Home', href: '/', icon: Home },
  { name: 'Affiliate', href: '/affiliate', icon: Handshake },
  { name: 'Bet History', href: '/profile/bets', icon: ListOrdered },
  { name: 'My', href: '/profile', icon: User },
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
        'fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {/* Top border line */}
      <div className="h-px bg-[#dddddd]" />
      <div className="flex h-[50px] items-center justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                active ? 'text-[#f4b53e]' : 'text-[#707070]'
              )}
            >
              <Icon className={cn('size-5', active && 'text-[#f4b53e]')} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
