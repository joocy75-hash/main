'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Percent,
  Calculator,
  Wallet,
  Gamepad2,
  BarChart3,
  BarChart2,
  ScrollText,
  Settings,
  Megaphone,
  Shield,
  Handshake,
  LogOut,
  ShieldCheck,
  Gift,
  Crown,
  Banknote,
  Bell,
  ShieldAlert,
  Activity,
  Globe,
  UsersRound,
  FileCheck,
  PieChart,
  Database,
  CalendarCheck,
  Disc3,
  RotateCcw,
  BadgePlus,
  Coins,
  ArrowLeftRight,
  MessageSquare,
  Target,
  FileText,
  ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: string;
};

type NavGroup = {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
};

const dashboardItem: NavItem = {
  label: '대시보드',
  href: '/dashboard',
  icon: LayoutDashboard,
  permission: 'dashboard.view',
};

const navGroups: NavGroup[] = [
  {
    title: '회원',
    icon: Users,
    items: [
      { label: '회원 관리', href: '/dashboard/users', icon: Users, permission: 'users.view' },
      { label: 'VIP 등급', href: '/dashboard/vip', icon: Crown, permission: 'users.view' },
      { label: 'KYC 인증', href: '/dashboard/kyc', icon: FileCheck, permission: 'users.view' },
      { label: '대량 작업', href: '/dashboard/bulk', icon: UsersRound, permission: 'users.update' },
    ],
  },
  {
    title: '재무',
    icon: Wallet,
    items: [
      { label: '입출금', href: '/dashboard/transactions', icon: Wallet, permission: 'transaction.view' },
      { label: '정산', href: '/dashboard/settlements', icon: Calculator, permission: 'settlement.view' },
      { label: '커미션', href: '/dashboard/commissions', icon: Percent, permission: 'commission.view' },
      { label: '급여 관리', href: '/dashboard/salary', icon: Banknote, permission: 'salary.view' },
      { label: '환율 관리', href: '/dashboard/exchange-rates', icon: ArrowLeftRight, permission: 'setting.view' },
    ],
  },
  {
    title: '게임',
    icon: Gamepad2,
    items: [
      { label: '게임 관리', href: '/dashboard/games', icon: Gamepad2, permission: 'game.view' },
      { label: '외부 API', href: '/dashboard/external-api', icon: Globe, permission: 'game_provider.view' },
      { label: '스포츠 모니터', href: '/dashboard/sports-monitor', icon: Activity, permission: 'game_provider.view' },
      { label: '한도 관리', href: '/dashboard/limits', icon: ShieldCheck, permission: 'setting.view' },
    ],
  },
  {
    title: '이벤트/보상',
    icon: Gift,
    items: [
      { label: '프로모션', href: '/dashboard/promotions', icon: Gift, permission: 'promotion.view' },
      { label: '출석 보상', href: '/dashboard/attendance', icon: CalendarCheck, permission: 'attendance.view' },
      { label: '럭키스핀', href: '/dashboard/spin', icon: Disc3, permission: 'spin.view' },
      { label: '페이백', href: '/dashboard/payback', icon: RotateCcw, permission: 'payback.view' },
      { label: '입금보너스', href: '/dashboard/deposit-bonus', icon: BadgePlus, permission: 'deposit_bonus.view' },
      { label: '미션 관리', href: '/dashboard/missions', icon: Target, permission: 'mission.view' },
      { label: '포인트 설정', href: '/dashboard/point-config', icon: Coins, permission: 'setting.view' },
    ],
  },
  {
    title: '콘텐츠',
    icon: Megaphone,
    items: [
      { label: '공지 관리', href: '/dashboard/announcements', icon: Megaphone, permission: 'announcement.view' },
      { label: '팝업 공지', href: '/dashboard/popups', icon: MessageSquare, permission: 'popup.view' },
      { label: '알림', href: '/dashboard/notifications', icon: Bell, permission: 'notification.view' },
    ],
  },
  {
    title: '파트너',
    icon: Handshake,
    items: [
      { label: '파트너', href: '/dashboard/partner', icon: Handshake, permission: 'partner.view' },
    ],
  },
  {
    title: '분석',
    icon: BarChart3,
    items: [
      { label: '리포트', href: '/dashboard/reports', icon: BarChart3, permission: 'report.view' },
      { label: 'BI 대시보드', href: '/dashboard/bi', icon: PieChart, permission: 'report.view' },
      { label: '분석/RTP', href: '/dashboard/analytics', icon: BarChart2, permission: 'report.view' },
      { label: '실시간 모니터링', href: '/dashboard/monitoring', icon: Activity, permission: 'monitoring.view' },
    ],
  },
  {
    title: '보안',
    icon: ShieldAlert,
    items: [
      { label: '감사 로그', href: '/dashboard/audit', icon: ScrollText, permission: 'audit_log.view' },
      { label: '관리자 로그', href: '/dashboard/admin-logs', icon: FileText, permission: 'audit_log.view' },
      { label: 'FDS', href: '/dashboard/fraud', icon: ShieldAlert, permission: 'fraud.view' },
      { label: 'IP 관리', href: '/dashboard/ip-management', icon: Globe, permission: 'setting.view' },
    ],
  },
  {
    title: '시스템',
    icon: Settings,
    items: [
      { label: '역할/권한', href: '/dashboard/roles', icon: Shield, permission: 'role.view' },
      { label: '시스템 설정', href: '/dashboard/settings', icon: Settings, permission: 'setting.view' },
      { label: '백업 관리', href: '/dashboard/backup', icon: Database, permission: 'setting.view' },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  return pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
}

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuthStore();
  const router = useRouter();

  const activeGroupTitles = useMemo(() => {
    const titles = new Set<string>();
    for (const group of navGroups) {
      for (const item of group.items) {
        if (isItemActive(pathname, item.href)) {
          titles.add(group.title);
        }
      }
    }
    return titles;
  }, [pathname]);

  const [expanded, setExpanded] = useState<Set<string>>(activeGroupTitles);

  const toggleGroup = (title: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch {
      // Ignore — stateless logout
    }
    logout();
    router.push('/login');
  };

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => hasPermission(item.permission)),
    }))
    .filter((group) => group.items.length > 0);

  const showDashboard = hasPermission(dashboardItem.permission);
  const isDashboardActive = pathname === dashboardItem.href;

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-border px-6">
        <h1 className="text-lg font-bold text-foreground">Game Admin</h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {showDashboard && (
          <Link
            href={dashboardItem.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              isDashboardActive
                ? 'bg-accent text-foreground font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <dashboardItem.icon className="h-4 w-4" />
            {dashboardItem.label}
          </Link>
        )}

        {visibleGroups.map((group) => {
          const isOpen = expanded.has(group.title) || activeGroupTitles.has(group.title);
          const hasActiveChild = group.items.some((item) => isItemActive(pathname, item.href));

          return (
            <div key={group.title}>
              <button
                onClick={() => toggleGroup(group.title)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  hasActiveChild
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <group.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{group.title}</span>
                <ChevronRight
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = isItemActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-lg pl-9 pr-3 py-1.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-accent text-foreground font-medium'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-3.5 w-3.5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
          </div>
          <ThemeToggle />
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
