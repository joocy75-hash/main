'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Trophy, Wallet, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavTab {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: NavTab[] = [
  { name: '홈', href: '/', icon: Home },
  { name: '게임', href: '/games', icon: Gamepad2 },
  { name: '스포츠', href: '/sports', icon: Trophy },
  { name: '지갑', href: '/wallet/deposit', icon: Wallet },
  { name: '더보기', href: '/profile', icon: Menu },
];

export const MobileNav = ({ className }: { className?: string }) => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/' || pathname === '';
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-sm',
        'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      <div className="flex h-[60px] items-center justify-around">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.name}
              href={tab.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('size-5', active && 'text-primary')} />
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
