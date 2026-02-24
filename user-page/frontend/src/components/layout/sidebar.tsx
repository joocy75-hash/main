'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Dices,
  Cherry,
  Spade,
  Trophy,
  Target,
  Coins,
  Gamepad2,
  CalendarCheck,
  ListChecks,
  RotateCcw,
  Crown,
  Headset,
  MessageSquare,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

const GAME_ITEMS: SidebarItem[] = [
  { name: '카지노', href: '/games?category=casino', icon: Dices, badge: 420 },
  { name: '슬롯', href: '/games?category=slot', icon: Cherry, badge: 850 },
  { name: '홀덤', href: '/games?category=holdem', icon: Spade, badge: 15 },
  { name: '스포츠', href: '/sports', icon: Trophy, badge: 0 },
  { name: '슈팅', href: '/games?category=shooting', icon: Target, badge: 30 },
  { name: '코인', href: '/games?category=coin', icon: Coins, badge: 12 },
  { name: '미니게임', href: '/games?category=mini_game', icon: Gamepad2, badge: 45 },
];

const PROMO_ITEMS: SidebarItem[] = [
  { name: '출석체크', href: '/promotions/attendance', icon: CalendarCheck },
  { name: '미션', href: '/promotions/missions', icon: ListChecks },
  { name: '럭키스핀', href: '/promotions/spin', icon: RotateCcw },
  { name: 'VIP', href: '/promotions/vip', icon: Crown },
];

const SUPPORT_ITEMS: SidebarItem[] = [
  { name: '고객센터', href: '/support', icon: Headset },
  { name: '문의', href: '/support', icon: MessageSquare },
];

const SidebarSection = ({
  title,
  items,
  pathname,
  fullUrl,
}: {
  title: string;
  items: SidebarItem[];
  pathname: string;
  fullUrl: string;
}) => (
  <div>
    <p className="mb-1 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {title}
    </p>
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = item.href.includes('?')
          ? fullUrl === item.href
          : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive
                ? 'border-l-2 border-primary bg-primary/10 font-medium text-primary'
                : 'border-l-2 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <Icon
              className={cn(
                'size-4 shrink-0',
                isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
              )}
            />
            <span className="flex-1">{item.name}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <Badge variant="secondary" className="px-1.5 text-[10px]">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  </div>
);

export const Sidebar = ({ className }: { className?: string }) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const category = searchParams.get('category');
  const fullUrl = category ? `${pathname}?category=${category}` : pathname;

  return (
    <aside
      className={cn(
        'w-60 shrink-0 border-r border-border bg-card/50',
        className
      )}
    >
      <div className="flex h-full flex-col gap-2 overflow-y-auto py-4 px-2">
        <SidebarSection title="게임" items={GAME_ITEMS} pathname={pathname} fullUrl={fullUrl} />
        <Separator className="mx-2" />
        <SidebarSection title="프로모션" items={PROMO_ITEMS} pathname={pathname} fullUrl={fullUrl} />
        <Separator className="mx-2" />
        <SidebarSection title="지원" items={SUPPORT_ITEMS} pathname={pathname} fullUrl={fullUrl} />
      </div>
    </aside>
  );
};
