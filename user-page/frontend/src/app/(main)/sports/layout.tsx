'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const SPORTS_TABS = [
  { name: '스포츠', href: '/sports', icon: Trophy },
  { name: 'e스포츠', href: '/sports/esports', icon: Gamepad2 },
];

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/sports') return pathname === '/sports';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-navigation */}
      <nav className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {SPORTS_TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              <span>{tab.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
