'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowDownToLine, ArrowUpFromLine, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const WALLET_TABS = [
  { name: '입금', href: '/wallet/deposit', icon: ArrowDownToLine },
  { name: '출금', href: '/wallet/withdraw', icon: ArrowUpFromLine },
  { name: '거래내역', href: '/wallet/transactions', icon: List },
];

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet sub-navigation */}
      <nav className="flex gap-1 rounded-lg border border-[#dddddd] bg-white p-1">
        {WALLET_TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
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
