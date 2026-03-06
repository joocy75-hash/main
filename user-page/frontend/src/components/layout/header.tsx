'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  User,
  LogOut,
  Settings,
  ChevronDown,
  RefreshCw,
  Menu,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn, formatUSDT } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';

const NAV_LINKS = [
  {
    href: '/games?category=casino',
    label: 'Casino',
    icon: '/images/ui-icons/icon_casino.webp',
  },
  {
    href: '/sports',
    label: 'Sports',
    icon: '/images/ui-icons/icon_sport.webp',
  },
  {
    href: '/minigame',
    label: 'Duck Race',
    icon: '/images/ui-icons/icon_duckrace.webp',
    badge: true,
  },
];

export const Header = ({ className }: { className?: string }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useProfileStore();
  const { user: authUser, isAuthenticated, logout } = useAuthStore();
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const notificationCount = unreadCount ?? 0;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-[70px] bg-white',
        className,
      )}
      style={{ boxShadow: 'rgba(0,0,0,0.16) 0px 5px 4px 0px' }}
    >
      <div className="flex h-full items-center justify-between px-4 lg:px-6">
        {/* -- Left: Hamburger (mobile) + Logo -- */}
        <div className="flex items-center gap-3">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <button
                type="button"
                className="flex items-center justify-center rounded-lg p-1.5 text-[#98a7b5] hover:bg-[#f0f0f2] hover:text-[#252531]"
              >
                <Menu className="size-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-white p-0">
              <SheetTitle className="sr-only">메뉴</SheetTitle>
            </SheetContent>
          </Sheet>

          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/logo/kzb_logo.png"
              alt="KZ Logo"
              width={80}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        {/* -- Center: Top Nav (desktop only) -- */}
        <nav className="ml-10 hidden flex-1 items-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-[15px] font-medium text-[#6b7280] transition-colors hover:text-[#252531]"
            >
              <Image
                src={link.icon}
                alt={link.label}
                width={20}
                height={20}
                className="size-5"
              />
              {link.label}
              {link.badge && (
                <span className="relative -ml-0.5 -mt-2 flex size-3.5 items-center justify-center rounded-full bg-[#feb614] text-[7px] font-bold text-white">
                  ★
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* -- Right: Balance / Deposit / Bell / Profile -- */}
        <div className="flex items-center gap-3">
          {isAuthenticated && authUser ? (
            <>
              {/* Balance Pill */}
              <div className="hidden h-[36px] items-center gap-2 rounded-full border border-[#e8e8e8] bg-[#f5f5f7] px-3 transition-colors hover:bg-[#eeeef0] sm:flex">
                <div className="flex size-[22px] items-center justify-center rounded-full bg-[#26A17B] text-[10px] font-bold text-white">
                  T
                </div>
                <span className="text-[14px] font-bold text-[#252531]">
                  USDT {formatUSDT(Number(authUser.balance) || 0)}
                </span>
                <button
                  onClick={() => setIsSpinning(true)}
                  onAnimationEnd={() => setIsSpinning(false)}
                  className="ml-0.5 text-[#b0b0b0] hover:text-[#252531]"
                >
                  <RefreshCw
                    className={cn('size-3.5', isSpinning && 'animate-spin')}
                  />
                </button>
                <ChevronDown className="size-3.5 text-[#b0b0b0]" />
              </div>

              {/* Deposit Button */}
              <Link
                href="/wallet/deposit"
                className="flex h-[36px] items-center justify-center text-[14px] font-bold text-white transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, #FFD651 0%, #FE960E 100%)',
                  borderRadius: '5px',
                  padding: '0 25px',
                }}
              >
                Deposit
              </Link>

              {/* Notification Bell */}
              <Link
                href="/messages"
                className="relative flex size-[36px] items-center justify-center rounded-full transition-colors hover:bg-[#f0f0f2]"
              >
                <Image
                  src="/images/ui-icons/icon_bell.webp"
                  alt="Notifications"
                  width={20}
                  height={20}
                  className="size-5"
                />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#feb614] px-1 text-[10px] font-bold text-white">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>

              {/* Profile Avatar / Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex size-[36px] items-center justify-center overflow-hidden rounded-full border border-[#e8e8e8] outline-none transition-transform hover:scale-105">
                    <Avatar className="size-full">
                      <AvatarImage
                        src="https://i.pravatar.cc/150?img=11"
                        alt="Profile"
                      />
                      <AvatarFallback className="bg-[#feb614]/20 text-[#feb614]">
                        {authUser.nickname?.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="mt-1 w-[200px]">
                  <div className="px-3 py-2">
                    <p className="text-sm font-bold text-foreground">
                      {authUser.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{authUser.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 size-4" /> My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings">
                      <Settings className="mr-2 size-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600"
                    onClick={() => logout()}
                  >
                    <LogOut className="mr-2 size-4" /> Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Unauthenticated */}
              <Link
                href="/login"
                className="px-3 py-2 text-sm font-semibold text-[#6b7280] hover:text-[#252531]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="flex h-[36px] items-center justify-center text-[14px] font-bold text-[#000000] transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(180deg, #FFD651 0%, #FE960E 100%)',
                  borderRadius: '5px',
                  padding: '0 25px',
                }}
              >
                Join Now
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
