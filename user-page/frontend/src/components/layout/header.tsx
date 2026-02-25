'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Bell,
  Wallet,
  Menu,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { GAME_CATEGORIES } from '@/lib/constants';
import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';

const formatKRW = (amount: number) => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

const PROMO_MENU = [
  { name: '출석체크', href: '/promotions/attendance' },
  { name: '미션', href: '/promotions/missions' },
  { name: '럭키스핀', href: '/promotions/spin' },
  { name: 'VIP', href: '/promotions/vip' },
];

const SUPPORT_MENU = [
  { name: '고객센터', href: '/support' },
  { name: '문의하기', href: '/support' },
];

export const Header = ({ className }: { className?: string }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { unreadCount, fetchUnreadCount } = useProfileStore();
  const { user: authUser, isAuthenticated, logout } = useAuthStore();

  // Poll unread count every 60s (only when authenticated)
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const notificationCount = unreadCount;

  return (
    <header
      className={cn(
        'sticky top-0 z-50 border-b border-[#dddddd] bg-white',
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4 lg:h-16 lg:px-6">
        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <button
              type="button"
              className="text-[#707070] hover:text-[#252531] p-1.5 rounded-lg hover:bg-[#f8f9fc] lg:hidden"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-white p-0">
            <SheetHeader className="border-b border-[#dddddd] p-4">
              <SheetTitle>
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">GP</span>
                  <span className="text-lg font-semibold text-[#252531]">Game Platform</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              <p className="px-3 py-2 text-xs font-semibold uppercase text-[#707070]">
                게임
              </p>
              {GAME_CATEGORIES.map((cat) => (
                <Link
                  key={cat.code}
                  href={`/games/${cat.code}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#252531] transition-colors hover:bg-[#f8f9fc]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-[#dddddd]" />
              <p className="px-3 py-2 text-xs font-semibold uppercase text-[#707070]">
                프로모션
              </p>
              {PROMO_MENU.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#252531] transition-colors hover:bg-[#f8f9fc]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-[#dddddd]" />
              <p className="px-3 py-2 text-xs font-semibold uppercase text-[#707070]">
                지원
              </p>
              {SUPPORT_MENU.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-[#252531] transition-colors hover:bg-[#f8f9fc]"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent lg:text-2xl">
            KZ
          </span>
          <span className="hidden text-base font-semibold text-[#252531] sm:inline">
            Casino
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <div className="mx-4 hidden flex-1 lg:block lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#707070]" />
            <input
              type="text"
              placeholder="게임 검색..."
              className="h-9 w-full bg-[#f8f9fc] border border-[#dddddd] rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:border-[#f4b53e] focus:ring-1 focus:ring-[#f4b53e]"
            />
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1 lg:hidden" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {isAuthenticated && authUser ? (
            <>
              {/* Balance (compact on mobile) */}
              <div className="bg-[#f8f9fc] rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 lg:px-3">
                <Wallet className="size-4 text-[#f4b53e]" />
                <span className="text-xs font-semibold text-[#252531] lg:text-sm">
                  {formatKRW(Number(authUser.balance) || 0)}
                </span>
                <span className="hidden text-xs text-[#707070] lg:inline">
                  원
                </span>
              </div>

              {/* Deposit button - gold prominent CTA */}
              <Link
                href="/wallet/deposit"
                className="hidden sm:flex items-center bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400 shadow-lg shadow-amber-500/20 text-sm px-4 py-1.5 rounded-lg"
              >
                입금
              </Link>

              {/* Notification bell */}
              <Link
                href="/messages"
                className="text-[#707070] hover:text-[#252531] relative p-1.5 rounded-lg hover:bg-[#f8f9fc]"
              >
                <Bell className="size-4" />
                {notificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center p-0 text-[10px] bg-red-500 text-white rounded-full">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-[#252531] hover:bg-[#f8f9fc] rounded-lg px-1.5 py-1 flex items-center gap-1.5"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-[#f4b53e]/20 text-xs text-[#f4b53e]">
                        {authUser.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm lg:inline">
                      {authUser.nickname}
                    </span>
                    <ChevronDown className="hidden size-3 lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{authUser.nickname}</p>
                    <p className="text-xs text-muted-foreground">
                      @{authUser.username}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="size-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wallet/deposit" className="cursor-pointer">
                      <Wallet className="size-4" />
                      입출금
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile/settings" className="cursor-pointer">
                      <Settings className="size-4" />
                      설정
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-destructive focus:text-destructive"
                    onClick={() => logout().then(() => { window.location.href = '/login'; })}
                  >
                    <LogOut className="size-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[#707070] hover:text-[#252531] text-sm px-3 py-1.5 rounded-lg hover:bg-[#f8f9fc]"
              >
                로그인
              </Link>
              <Link
                href="/register"
                className="bg-gradient-to-r from-[#ffd651] to-[#fe960e] text-white font-bold text-sm px-4 py-1.5 rounded-lg"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
