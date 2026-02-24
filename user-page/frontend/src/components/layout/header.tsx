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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
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
        'sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm',
        className
      )}
    >
      <div className="flex h-14 items-center gap-2 px-4 lg:h-16 lg:px-6">
        {/* Mobile menu button */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="ghost" size="icon-sm">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle>
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <span className="text-xl font-bold text-primary">GP</span>
                  <span className="text-lg font-semibold">Game Platform</span>
                </Link>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                게임
              </p>
              {GAME_CATEGORIES.map((cat) => (
                <Link
                  key={cat.code}
                  href={`/games/${cat.code}`}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                프로모션
              </p>
              {PROMO_MENU.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>{item.name}</span>
                </Link>
              ))}
              <Separator className="my-2" />
              <p className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                지원
              </p>
              {SUPPORT_MENU.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-secondary"
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
          <span className="text-xl font-extrabold tracking-tight text-primary lg:text-2xl">
            GP
          </span>
          <span className="hidden text-base font-semibold sm:inline">
            Game Platform
          </span>
        </Link>

        {/* Search bar (desktop) */}
        <div className="mx-4 hidden flex-1 lg:block lg:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="게임 검색..."
              className="h-9 bg-secondary/50 pl-9"
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
              <div className="flex items-center gap-1.5 rounded-lg bg-secondary/60 px-2.5 py-1.5 lg:px-3">
                <Wallet className="size-4 text-accent" />
                <span className="text-xs font-semibold lg:text-sm">
                  {formatKRW(Number(authUser.balance) || 0)}
                </span>
                <span className="hidden text-xs text-muted-foreground lg:inline">
                  원
                </span>
              </div>

              {/* Deposit button */}
              <Button size="sm" className="hidden sm:flex" asChild>
                <Link href="/wallet/deposit">입금</Link>
              </Button>

              {/* Notification bell */}
              <Button variant="ghost" size="icon-sm" className="relative" asChild>
                <Link href="/messages">
                  <Bell className="size-4" />
                  {notificationCount > 0 && (
                    <Badge className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center p-0 text-[10px]">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Profile dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 px-1.5 lg:px-2"
                  >
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-primary/20 text-xs text-primary">
                        {authUser.nickname.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-sm lg:inline">
                      {authUser.nickname}
                    </span>
                    <ChevronDown className="hidden size-3 lg:block" />
                  </Button>
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
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">로그인</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
