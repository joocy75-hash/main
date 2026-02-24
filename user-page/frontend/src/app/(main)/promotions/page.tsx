'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  ListChecks,
  RotateCcw,
  Gem,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const CATEGORY_FILTERS = [
  { value: 'all', label: '전체' },
  { value: 'deposit', label: '입금보너스' },
  { value: 'payback', label: '페이백' },
  { value: 'event', label: '이벤트' },
];

const QUICK_LINKS = [
  { name: '출석체크', href: '/promotions/attendance', icon: CalendarCheck },
  { name: '미션', href: '/promotions/missions', icon: ListChecks },
  { name: '럭키스핀', href: '/promotions/spin', icon: RotateCcw },
  { name: '포인트 전환', href: '/promotions/points', icon: Gem },
];

const VIP_NAMES: Record<number, { name: string; icon: string }> = {
  1: { name: '브론즈', icon: '🥉' },
  2: { name: '실버', icon: '🥈' },
  3: { name: '골드', icon: '🥇' },
  4: { name: '플래티넘', icon: '💎' },
  5: { name: '다이아몬드', icon: '👑' },
  6: { name: '마스터', icon: '🏆' },
  7: { name: '그랜드마스터', icon: '⭐' },
  8: { name: '챔피언', icon: '🌟' },
  9: { name: '레전드', icon: '🔱' },
  10: { name: '미소시아', icon: '✨' },
};

// Fallback promotion data for display
const FALLBACK_PROMOTIONS = [
  {
    id: 1,
    title: '첫 입금 100% 보너스',
    description: '첫 입금 시 100% 보너스 지급! 최대 500,000원',
    category: 'deposit',
    detail: '최대 500,000원 | 롤오버 x3',
    isActive: true,
  },
  {
    id: 2,
    title: '매일 입금 10% 보너스',
    description: '매번 입금할 때마다 10% 보너스를 받으세요',
    category: 'deposit',
    detail: '최대 100,000원 | 롤오버 x5',
    isActive: true,
  },
  {
    id: 3,
    title: '일일 페이백 5%',
    description: '하루 순손실의 5%를 돌려받으세요',
    category: 'payback',
    detail: '최대 500,000원',
    isActive: true,
  },
  {
    id: 4,
    title: '주간 페이백 10%',
    description: '주간 순손실의 10%를 매주 월요일 지급',
    category: 'payback',
    detail: '최대 2,000,000원',
    isActive: true,
  },
  {
    id: 5,
    title: '친구 추천 이벤트',
    description: '친구를 추천하면 추천인 10,000원, 피추천인 5,000원 보너스!',
    category: 'event',
    detail: '최소 입금 50,000원 조건',
    isActive: true,
  },
];

export default function PromotionsHubPage() {
  const {
    promotions,
    promotionCategory,
    vipInfo,
    fetchPromotions,
    fetchVipInfo,
    setPromotionCategory,
  } = useEventStore();

  useEffect(() => {
    fetchPromotions();
    fetchVipInfo();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use API promotions if available, otherwise fallback
  const displayPromotions = promotions.length > 0
    ? promotions.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        category: p.category,
        detail: '',
        isActive: p.isActive,
      }))
    : FALLBACK_PROMOTIONS;

  const filteredPromotions = promotionCategory === 'all'
    ? displayPromotions
    : displayPromotions.filter((p) => p.category === promotionCategory);

  const vipLevel = vipInfo?.currentLevel || 1;
  const vipData = VIP_NAMES[vipLevel] || VIP_NAMES[1];
  const nextVipData = VIP_NAMES[(vipInfo?.nextLevel || 2)] || VIP_NAMES[2];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">프로모션</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            다양한 보너스와 이벤트를 확인하세요
          </p>
        </CardContent>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORY_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={promotionCategory === filter.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setPromotionCategory(filter.value)}
            className="shrink-0"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Promotion cards */}
      <div className="flex flex-col gap-3">
        {filteredPromotions.map((promo) => (
          <Card key={promo.id} className="overflow-hidden">
            <CardContent className="flex flex-col gap-2 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">{promo.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {CATEGORY_FILTERS.find((f) => f.value === promo.category)?.label || promo.category}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {promo.description}
                  </p>
                  {promo.detail && (
                    <p className="mt-1 text-xs font-medium text-yellow-400">
                      {promo.detail}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* VIP section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">나의 VIP 등급</CardTitle>
            <Button variant="link" size="sm" asChild>
              <Link href="/promotions/vip">상세보기</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{vipData.icon}</span>
              <div>
                <p className="text-sm font-bold">
                  {vipData.name} (Lv.{vipLevel})
                </p>
                <p className="text-xs text-muted-foreground">현재 등급</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChevronRight className="size-4" />
              <div className="text-right">
                <p className="text-sm font-medium">
                  {nextVipData.icon} {nextVipData.name}
                </p>
                <p className="text-xs text-muted-foreground">다음 등급</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">진행률</span>
              <span className="font-medium">{vipInfo?.progress || 0}%</span>
            </div>
            <Progress value={vipInfo?.progress || 0} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">바로가기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card/50 p-4 text-center transition-colors hover:bg-secondary"
                >
                  <Icon className="size-6 text-primary" />
                  <span className="text-xs font-medium">{link.name}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
