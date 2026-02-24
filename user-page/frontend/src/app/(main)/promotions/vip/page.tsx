'use client';

import { useEffect } from 'react';
import { Check, ChevronRight } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const VIP_DISPLAY: Record<number, { name: string; nameKo: string; icon: string; color: string }> = {
  1: { name: 'Bronze', nameKo: '브론즈', icon: '🥉', color: 'text-amber-600' },
  2: { name: 'Silver', nameKo: '실버', icon: '🥈', color: 'text-gray-400' },
  3: { name: 'Gold', nameKo: '골드', icon: '🥇', color: 'text-yellow-500' },
  4: { name: 'Platinum', nameKo: '플래티넘', icon: '💎', color: 'text-cyan-400' },
  5: { name: 'Diamond', nameKo: '다이아몬드', icon: '👑', color: 'text-blue-400' },
  6: { name: 'Master', nameKo: '마스터', icon: '🏆', color: 'text-purple-400' },
  7: { name: 'Grand Master', nameKo: '그랜드마스터', icon: '⭐', color: 'text-yellow-300' },
  8: { name: 'Champion', nameKo: '챔피언', icon: '🌟', color: 'text-orange-400' },
  9: { name: 'Legend', nameKo: '레전드', icon: '🔱', color: 'text-red-400' },
  10: { name: 'Mythic', nameKo: '미시크', icon: '✨', color: 'text-pink-400' },
};

// Fallback VIP levels for display
const FALLBACK_VIP_LEVELS = [
  { level: 1, name: 'Bronze', requiredBet: '0', cashbackRate: '0.5', benefits: ['기본 혜택'] },
  { level: 2, name: 'Silver', requiredBet: '1000000', cashbackRate: '1.0', benefits: ['출석 보너스 UP'] },
  { level: 3, name: 'Gold', requiredBet: '5000000', cashbackRate: '1.5', benefits: ['미션 보상 UP', '페이백 증가'] },
  { level: 4, name: 'Platinum', requiredBet: '20000000', cashbackRate: '2.0', benefits: ['럭키스핀 추가', '전용 프로모션'] },
  { level: 5, name: 'Diamond', requiredBet: '50000000', cashbackRate: '3.0', benefits: ['VIP 전용 이벤트', '우선 출금'] },
  { level: 6, name: 'Master', requiredBet: '100000000', cashbackRate: '4.0', benefits: ['전담 매니저', '특별 보너스'] },
  { level: 7, name: 'Grand Master', requiredBet: '300000000', cashbackRate: '5.0', benefits: ['최고 캐시백', '무제한 출금'] },
  { level: 8, name: 'Champion', requiredBet: '500000000', cashbackRate: '6.0', benefits: ['최상위 혜택', 'VIP 파티 초대'] },
  { level: 9, name: 'Legend', requiredBet: '1000000000', cashbackRate: '7.0', benefits: ['올인클루시브', '해외 여행 이벤트'] },
  { level: 10, name: 'Mythic', requiredBet: '3000000000', cashbackRate: '10.0', benefits: ['전 혜택 최대', '맞춤 서비스'] },
];

export default function VipPage() {
  const {
    vipInfo,
    vipLevels,
    fetchVipInfo,
    fetchVipLevels,
  } = useEventStore();

  useEffect(() => {
    fetchVipInfo();
    fetchVipLevels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const levels = vipLevels.length > 0 ? vipLevels : FALLBACK_VIP_LEVELS;
  const currentLevel = vipInfo?.currentLevel || 1;
  const currentVip = VIP_DISPLAY[currentLevel] || VIP_DISPLAY[1];
  const nextLevel = vipInfo?.nextLevel || 2;
  const nextVip = VIP_DISPLAY[nextLevel] || VIP_DISPLAY[2];

  return (
    <div className="flex flex-col gap-4">
      {/* Current VIP card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-900/30 via-yellow-800/20 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">나의 VIP 등급</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Current level display */}
            <div className="flex items-center gap-4">
              <div className="flex size-16 items-center justify-center rounded-xl border border-yellow-500/30 bg-yellow-500/10">
                <span className="text-3xl">{currentVip.icon}</span>
              </div>
              <div className="flex-1">
                <p className={cn('text-xl font-bold', currentVip.color)}>
                  {currentVip.nameKo}
                </p>
                <p className="text-sm text-muted-foreground">
                  Lv.{currentLevel} {currentVip.name}
                </p>
              </div>
            </div>

            {/* Progress to next level */}
            {currentLevel < 10 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5">
                    <span>{currentVip.icon}</span>
                    <span className="font-medium">{currentVip.nameKo}</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                  <div className="flex items-center gap-1.5">
                    <span>{nextVip.icon}</span>
                    <span className="font-medium">{nextVip.nameKo}</span>
                  </div>
                </div>
                <Progress value={vipInfo?.progress || 0} className="h-3" />
                <p className="text-center text-xs text-muted-foreground">
                  진행률 {vipInfo?.progress || 0}%
                </p>
              </div>
            )}

            {/* Current benefits */}
            {vipInfo?.benefits && vipInfo.benefits.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">현재 혜택</p>
                <div className="flex flex-wrap gap-1.5">
                  {vipInfo.benefits.map((benefit, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      {/* VIP levels table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">전체 VIP 등급</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">등급</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className="text-right">필요 베팅</TableHead>
                  <TableHead className="text-right">캐시백</TableHead>
                  <TableHead>혜택</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {levels.map((level) => {
                  const display = VIP_DISPLAY[level.level] || VIP_DISPLAY[1];
                  const isCurrent = level.level === currentLevel;
                  return (
                    <TableRow
                      key={level.level}
                      className={cn(
                        isCurrent && 'bg-primary/5 border-l-2 border-l-primary'
                      )}
                    >
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span>{display.icon}</span>
                          <span className="text-xs text-muted-foreground">Lv.{level.level}</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn('font-medium', isCurrent && display.color)}>
                        {display.nameKo}
                        {isCurrent && (
                          <Badge variant="outline" className="ml-2 text-[10px]">현재</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {Number(level.requiredBet).toLocaleString('ko-KR')}원
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-yellow-400">
                        {level.cashbackRate}%
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {level.benefits.map((b, i) => (
                            <span key={i} className="text-xs text-muted-foreground">{b}</span>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card layout */}
          <div className="flex flex-col gap-2 sm:hidden">
            {levels.map((level) => {
              const display = VIP_DISPLAY[level.level] || VIP_DISPLAY[1];
              const isCurrent = level.level === currentLevel;
              return (
                <div
                  key={level.level}
                  className={cn(
                    'rounded-lg border border-border p-3',
                    isCurrent && 'border-primary bg-primary/5'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{display.icon}</span>
                      <div>
                        <p className={cn('text-sm font-bold', isCurrent && display.color)}>
                          {display.nameKo}
                          {isCurrent && (
                            <Badge variant="outline" className="ml-1.5 text-[10px]">현재</Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Lv.{level.level}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-yellow-400">{level.cashbackRate}%</p>
                      <p className="text-[10px] text-muted-foreground">캐시백</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>필요 베팅: {Number(level.requiredBet).toLocaleString('ko-KR')}원</span>
                    {level.level <= currentLevel && (
                      <Check className="size-4 text-green-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
