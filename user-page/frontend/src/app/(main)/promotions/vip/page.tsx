'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Wallet,
  ArrowUpFromLine,
  Gift,
  CalendarDays,
  Star,
  Cake,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const VIP_DISPLAY: Record<number, { name: string; nameKo: string; icon: string; gradient: string; textColor: string }> = {
  1: { name: 'Bronze', nameKo: '브론즈', icon: '🥉', gradient: 'from-amber-700 to-amber-500', textColor: 'text-amber-600' },
  2: { name: 'Silver', nameKo: '실버', icon: '🥈', gradient: 'from-gray-500 to-gray-300', textColor: 'text-gray-500' },
  3: { name: 'Gold', nameKo: '골드', icon: '🥇', gradient: 'from-yellow-600 to-yellow-400', textColor: 'text-yellow-600' },
  4: { name: 'Platinum', nameKo: '플래티넘', icon: '💎', gradient: 'from-cyan-600 to-cyan-400', textColor: 'text-cyan-600' },
  5: { name: 'Diamond', nameKo: '다이아몬드', icon: '👑', gradient: 'from-blue-600 to-blue-400', textColor: 'text-blue-600' },
  6: { name: 'Master', nameKo: '마스터', icon: '🏆', gradient: 'from-purple-600 to-purple-400', textColor: 'text-purple-600' },
  7: { name: 'Grand Master', nameKo: '그랜드마스터', icon: '⭐', gradient: 'from-yellow-500 to-amber-300', textColor: 'text-yellow-600' },
  8: { name: 'Champion', nameKo: '챔피언', icon: '🌟', gradient: 'from-orange-600 to-orange-400', textColor: 'text-orange-600' },
  9: { name: 'Legend', nameKo: '레전드', icon: '🔱', gradient: 'from-red-600 to-red-400', textColor: 'text-red-600' },
  10: { name: 'Mythic', nameKo: '미시크', icon: '✨', gradient: 'from-pink-600 to-fuchsia-400', textColor: 'text-pink-600' },
};

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

const VIP_BENEFITS = [
  { label: '일일 출금 횟수', icon: ArrowUpFromLine, key: 'withdrawalsPerDay' },
  { label: '일일 출금 한도', icon: Wallet, key: 'dailyWithdrawLimit' },
  { label: '승급 보너스', icon: Trophy, key: 'upgradeBonus' },
  { label: '일일 보너스', icon: Gift, key: 'dailyBonus' },
  { label: '주간 보너스', icon: CalendarDays, key: 'weeklyBonus' },
  { label: '월간 보너스', icon: Star, key: 'monthlyBonus' },
  { label: '생일 보너스', icon: Cake, key: 'birthdayBonus' },
];

const BENEFIT_VALUES: Record<number, Record<string, string>> = {
  1: { withdrawalsPerDay: '10', dailyWithdrawLimit: '2,000', upgradeBonus: '-', dailyBonus: '12', weeklyBonus: '12', monthlyBonus: '21', birthdayBonus: '33' },
  2: { withdrawalsPerDay: '15', dailyWithdrawLimit: '5,000', upgradeBonus: '100', dailyBonus: '25', weeklyBonus: '50', monthlyBonus: '100', birthdayBonus: '100' },
  3: { withdrawalsPerDay: '20', dailyWithdrawLimit: '10,000', upgradeBonus: '500', dailyBonus: '50', weeklyBonus: '100', monthlyBonus: '250', birthdayBonus: '300' },
  4: { withdrawalsPerDay: '25', dailyWithdrawLimit: '20,000', upgradeBonus: '1,000', dailyBonus: '100', weeklyBonus: '250', monthlyBonus: '500', birthdayBonus: '600' },
  5: { withdrawalsPerDay: '30', dailyWithdrawLimit: '50,000', upgradeBonus: '3,000', dailyBonus: '200', weeklyBonus: '500', monthlyBonus: '1,000', birthdayBonus: '1,500' },
  6: { withdrawalsPerDay: '40', dailyWithdrawLimit: '100,000', upgradeBonus: '5,000', dailyBonus: '500', weeklyBonus: '1,000', monthlyBonus: '3,000', birthdayBonus: '3,000' },
  7: { withdrawalsPerDay: '50', dailyWithdrawLimit: '200,000', upgradeBonus: '10,000', dailyBonus: '1,000', weeklyBonus: '3,000', monthlyBonus: '5,000', birthdayBonus: '5,000' },
  8: { withdrawalsPerDay: '60', dailyWithdrawLimit: '500,000', upgradeBonus: '30,000', dailyBonus: '2,000', weeklyBonus: '5,000', monthlyBonus: '10,000', birthdayBonus: '10,000' },
  9: { withdrawalsPerDay: '80', dailyWithdrawLimit: '1,000,000', upgradeBonus: '50,000', dailyBonus: '5,000', weeklyBonus: '10,000', monthlyBonus: '30,000', birthdayBonus: '30,000' },
  10: { withdrawalsPerDay: '100', dailyWithdrawLimit: '무제한', upgradeBonus: '100,000', dailyBonus: '10,000', weeklyBonus: '30,000', monthlyBonus: '50,000', birthdayBonus: '50,000' },
};

export default function VipPage() {
  const {
    vipInfo,
    vipLevels,
    fetchVipInfo,
    fetchVipLevels,
  } = useEventStore();

  const [selectedLevel, setSelectedLevel] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVipInfo();
    fetchVipLevels();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (vipInfo?.currentLevel && vipInfo.currentLevel !== selectedLevel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLevel(vipInfo.currentLevel);
    }
  }, [vipInfo?.currentLevel]);

  const levels = vipLevels.length > 0 ? vipLevels : FALLBACK_VIP_LEVELS;
  const currentLevel = vipInfo?.currentLevel || 1;

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const selectedVip = VIP_DISPLAY[selectedLevel] || VIP_DISPLAY[1];
  const benefitValues = BENEFIT_VALUES[selectedLevel] || BENEFIT_VALUES[1];

  return (
    <div className="flex flex-col gap-4">
      {/* VIP Header */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        {/* User info */}
        <div className="mb-4">
          <p className="text-lg font-bold">VIP</p>
          <p className="text-xs text-[#6b7280]">
            현재 등급: {VIP_DISPLAY[currentLevel]?.nameKo || 'Bronze'} (VIP {currentLevel})
          </p>
        </div>

        {/* VIP Level Carousel */}
        <div className="relative">
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute -left-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#f5f5f7]/80 shadow-md backdrop-blur-sm transition-colors hover:bg-[#f5f5f7]"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute -right-2 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-[#f5f5f7]/80 shadow-md backdrop-blur-sm transition-colors hover:bg-[#f5f5f7]"
          >
            <ChevronRight className="size-4" />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto px-2 pb-2 scrollbar-hide"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => {
              const vip = VIP_DISPLAY[level] || VIP_DISPLAY[1];
              const isActive = level === currentLevel;
              const isSelected = level === selectedLevel;
              const isLocked = level > currentLevel;

              return (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={cn(
                    'relative flex min-w-[140px] shrink-0 flex-col items-start gap-1 rounded-xl p-4 transition-all',
                    isActive
                      ? `bg-gradient-to-br ${vip.gradient} text-white shadow-lg`
                      : isSelected
                        ? 'border-2 border-[#feb614] bg-[#e8e8e8]'
                        : 'border border-[#e8e8e8] bg-[#e8e8e8]/50 hover:bg-[#f0f0f2]',
                    isLocked && !isSelected && 'opacity-60'
                  )}
                >
                  <span className="text-2xl">{vip.icon}</span>
                  <span className={cn(
                    'text-lg font-bold',
                    isActive ? 'text-white' : ''
                  )}>
                    VIP {level}
                  </span>
                  <span className={cn(
                    'text-xs',
                    isActive ? 'text-white/80' : 'text-[#6b7280]'
                  )}>
                    {vip.nameKo}
                  </span>
                  {isActive && (
                    <div className="absolute right-2 top-2">
                      <Check className="size-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrade Requirements */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div>
              <p className="text-sm">승급 누적 입금 (30일)</p>
              <p className="text-xs text-[#6b7280]">
                달성: 0 / {levels[selectedLevel - 1]?.requiredBet ? Number(levels[selectedLevel - 1].requiredBet).toLocaleString('ko-KR') : '0'}
              </p>
            </div>
            <span className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold',
              currentLevel >= selectedLevel
                ? 'bg-green-100 text-green-700'
                : 'bg-[#e8e8e8] text-[#6b7280]'
            )}>
              {currentLevel >= selectedLevel ? '달성' : '미달성'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div>
              <p className="text-sm">승급 턴오버 (30일)</p>
              <p className="text-xs text-[#6b7280]">
                달성: 0 / {levels[selectedLevel - 1]?.requiredBet ? Number(levels[selectedLevel - 1].requiredBet).toLocaleString('ko-KR') : '0'}
              </p>
            </div>
            <span className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold',
              currentLevel >= selectedLevel
                ? 'bg-green-100 text-green-700'
                : 'bg-[#e8e8e8] text-[#6b7280]'
            )}>
              {currentLevel >= selectedLevel ? '달성' : '미달성'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div>
              <p className="text-sm">유지 누적 입금 (90일)</p>
              <p className="text-xs text-[#6b7280]">유지 조건</p>
            </div>
            <span className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold',
              currentLevel >= selectedLevel
                ? 'bg-green-100 text-green-700'
                : 'bg-[#e8e8e8] text-[#6b7280]'
            )}>
              {currentLevel >= selectedLevel ? '달성' : '미달성'}
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div>
              <p className="text-sm">유지 가입 일수 (90일)</p>
              <p className="text-xs text-[#6b7280]">유지 조건</p>
            </div>
            <span className={cn(
              'rounded-md px-2.5 py-1 text-xs font-semibold',
              currentLevel >= selectedLevel
                ? 'bg-green-100 text-green-700'
                : 'bg-[#e8e8e8] text-[#6b7280]'
            )}>
              {currentLevel >= selectedLevel ? '달성' : '미달성'}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {currentLevel < 10 && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs text-[#6b7280]">
              <span>VIP {currentLevel} → VIP {currentLevel + 1}</span>
              <span>{vipInfo?.progress || 0}%</span>
            </div>
            <Progress value={vipInfo?.progress || 0} className="h-2" />
          </div>
        )}
      </div>

      {/* VIP Exclusive Benefits */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h3 className="mb-4 text-base font-semibold">
          VIP{selectedLevel} Exclusive
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {VIP_BENEFITS.map((benefit) => {
            const Icon = benefit.icon;
            const value = benefitValues[benefit.key] || '-';
            return (
              <div
                key={benefit.key}
                className="flex flex-col items-center gap-2 rounded-xl border border-[#e8e8e8] bg-[#e8e8e8]/30 p-4 text-center"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-[#feb614]/10">
                  <Icon className="size-5 text-[#feb614]" />
                </div>
                <p className="text-xs text-[#6b7280] leading-tight">{benefit.label}</p>
                <p className="text-sm font-bold text-[#feb614]">{value}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* All VIP Levels Comparison */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h3 className="mb-4 text-base font-semibold">전체 VIP 등급 비교</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-[#e8e8e8]">
                <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6b7280]">등급</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">필요 베팅</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">캐시백</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">일일 보너스</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">주간 보너스</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">월간 보너스</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">생일 보너스</th>
              </tr>
            </thead>
            <tbody>
              {levels.map((level) => {
                const display = VIP_DISPLAY[level.level] || VIP_DISPLAY[1];
                const isCurrent = level.level === currentLevel;
                const values = BENEFIT_VALUES[level.level] || BENEFIT_VALUES[1];
                return (
                  <tr
                    key={level.level}
                    className={cn(
                      'border-b border-[#e8e8e8]/50 transition-colors hover:bg-[#f0f0f2]/50',
                      isCurrent && 'bg-[#feb614]/5'
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span>{display.icon}</span>
                        <span className={cn('font-medium', isCurrent && display.textColor)}>
                          VIP {level.level}
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-[#feb614]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#feb614]">현재</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {Number(level.requiredBet).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-[#feb614]">{level.cashbackRate}%</td>
                    <td className="px-3 py-2.5 text-right">{values.dailyBonus}</td>
                    <td className="px-3 py-2.5 text-right">{values.weeklyBonus}</td>
                    <td className="px-3 py-2.5 text-right">{values.monthlyBonus}</td>
                    <td className="px-3 py-2.5 text-right">{values.birthdayBonus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
