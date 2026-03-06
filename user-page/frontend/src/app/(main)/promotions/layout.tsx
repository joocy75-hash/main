'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gift,
  CalendarCheck,
  ListChecks,
  RotateCcw,
  Crown,
  Gem,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PROMO_TABS = [
  { name: '프로모션', href: '/promotions', icon: Gift },
  { name: '출석체크', href: '/promotions/attendance', icon: CalendarCheck },
  { name: '미션', href: '/promotions/missions', icon: ListChecks },
  { name: '럭키스핀', href: '/promotions/spin', icon: RotateCcw },
  { name: 'VIP', href: '/promotions/vip', icon: Crown },
  { name: '포인트', href: '/promotions/points', icon: Gem },
];

export default function PromotionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/promotions') return pathname === '/promotions';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-navigation */}
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] p-1 scrollbar-none">
        {PROMO_TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#feb614] text-black'
                  : 'text-[#6b7280] hover:bg-[#f0f0f2] hover:text-[#252531]'
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
