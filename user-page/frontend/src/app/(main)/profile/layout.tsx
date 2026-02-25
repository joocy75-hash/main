'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  FileText,
  DollarSign,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PROFILE_TABS = [
  { name: '마이페이지', href: '/profile', icon: User },
  { name: '베팅내역', href: '/profile/bets', icon: FileText },
  { name: '머니내역', href: '/profile/money', icon: DollarSign },
  { name: '접속내역', href: '/profile/login-history', icon: Clock },
];

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/profile') return pathname === '/profile';
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-navigation */}
      <nav className="flex gap-1 overflow-x-auto rounded-lg border border-[#dddddd] bg-white p-1 scrollbar-none">
        {PROFILE_TABS.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-[#f4b53e] text-black'
                  : 'text-[#707070] hover:bg-[#edeef3] hover:text-[#252531]'
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
