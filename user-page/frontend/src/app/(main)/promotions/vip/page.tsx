'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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

const FALLBACK_BENEFIT_VALUES: Record<number, Record<string, string>> = {
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
  }, [vipInfo?.currentLevel, selectedLevel]);

  const levels = vipLevels.length > 0 ? vipLevels : FALLBACK_VIP_LEVELS;
  const currentLevel = vipInfo?.currentLevel || 1;

  const progressPercent = useMemo(() => {
    const raw = vipInfo?.progress ?? 0;
    return Math.min(100, Math.max(0, raw));
  }, [vipInfo?.progress]);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return;
    const scrollAmount = 200;
    carouselRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const benefitValues = useMemo(() => {
    return FALLBACK_BENEFIT_VALUES[selectedLevel] || FALLBACK_BENEFIT_VALUES[1];
  }, [selectedLevel]);

  return (
    <div className="flex flex-col gap-5">
      {/* VIP Tracker & Carousel */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        {/* User info */}
        <div className="border-b border-[#e2e8f0] px-5 py-5 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full border border-white bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] flex items-center justify-center shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_2px_4px_rgba(255,255,255,1)] text-3xl drop-shadow-md">
              {VIP_DISPLAY[currentLevel]?.icon || '🥉'}
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-[#64748b] mb-0.5">내 VIP 등급</p>
              <h2 className="text-xl font-black text-[#1e293b] flex items-center gap-2">
                VIP {currentLevel} <span className="text-[#f59e0b] drop-shadow-sm text-sm">({VIP_DISPLAY[currentLevel]?.nameKo || '브론즈'})</span>
              </h2>
            </div>
          </div>
          {currentLevel < 10 && (
            <div className="flex flex-col gap-1.5 w-full sm:w-1/3 min-w-[200px] bg-white rounded-xl p-3 border border-[#e2e8f0] shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-extrabold text-[#64748b]">
                <span>다음 등급: VIP {currentLevel + 1}</span>
                <span className="text-[#f59e0b]">{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-[#f1f5f9] shadow-inner overflow-hidden border border-[#e2e8f0]">
                <div 
                  className="h-full bg-gradient-to-r from-[#ffd651] to-[#f59e0b] rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* VIP Level Carousel */}
        <div className="relative bg-[#fbfcfd] py-6 px-4">
          <button
            onClick={() => scrollCarousel('left')}
            className="absolute left-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_2px_2px_rgba(255,255,255,1)] border border-[#e2e8f0] text-[#64748b] transition-all hover:text-[#1e293b] hover:scale-105"
          >
            <ChevronLeft className="size-5 ml-0.5" />
          </button>
          <button
            onClick={() => scrollCarousel('right')}
            className="absolute right-2 top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_2px_2px_rgba(255,255,255,1)] border border-[#e2e8f0] text-[#64748b] transition-all hover:text-[#1e293b] hover:scale-105"
          >
            <ChevronRight className="size-5 mr-0.5" />
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto px-6 pt-5 pb-5 -mt-3 -mb-3 scrollbar-hide snap-x"
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
                    'relative flex min-w-[140px] shrink-0 flex-col items-center gap-2 rounded-2xl p-5 transition-all snap-center',
                    isActive
                      ? `bg-gradient-to-br ${vip.gradient} text-white shadow-[0_10px_20px_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.3)] transform -translate-y-1 border border-white/20`
                      : isSelected
                        ? 'border-2 border-[#f59e0b] bg-yellow-50/50 shadow-md transform -translate-y-0.5'
                        : 'border border-[#e2e8f0] bg-white shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5',
                    isLocked && !isSelected && 'opacity-60 grayscale-[0.3]'
                  )}
                >
                  <span className="text-3xl drop-shadow-md mb-1 transition-transform hover:scale-110">{vip.icon}</span>
                  <span className={cn(
                    'text-[16px] font-black tracking-wide',
                    isActive ? 'text-white drop-shadow-sm' : 'text-[#1e293b]'
                  )}>
                    VIP {level}
                  </span>
                  <span className={cn(
                    'text-[12px] font-bold rounded-full px-2.5 py-0.5',
                    isActive ? 'bg-white/20 text-white' : 'bg-[#f1f5f9] text-[#64748b]'
                  )}>
                    {vip.nameKo}
                  </span>
                  {isActive && (
                    <div className="absolute -right-2 -top-2 size-6 rounded-full bg-[#10b981] border-2 border-white flex items-center justify-center shadow-md">
                      <Check className="size-3.5 text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Upgrade Requirements */}
        <div className="border-t border-[#e2e8f0] p-5 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h3 className="mb-4 text-[14px] font-black text-[#1e293b] flex items-center gap-2">
            <span className="text-lg">🎯</span> 승급 및 유지 조건
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
              <div>
                <p className="text-[13px] font-extrabold text-[#1e293b]">승급 누적 입금 <span className="text-[#94a3b8] font-bold">(30일)</span></p>
                <p className="text-[12px] font-bold text-[#64748b] mt-0.5">
                  <span className="text-[#f59e0b]">0</span> / {levels[selectedLevel - 1]?.requiredBet ? Number(levels[selectedLevel - 1].requiredBet).toLocaleString('ko-KR') : '0'}
                </p>
              </div>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm',
                currentLevel >= selectedLevel
                  ? 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border border-green-200'
                  : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
              )}>
                {currentLevel >= selectedLevel ? '달성 완료' : '미달성'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
              <div>
                <p className="text-[13px] font-extrabold text-[#1e293b]">승급 턴오버 <span className="text-[#94a3b8] font-bold">(30일)</span></p>
                <p className="text-[12px] font-bold text-[#64748b] mt-0.5">
                  <span className="text-[#f59e0b]">0</span> / {levels[selectedLevel - 1]?.requiredBet ? Number(levels[selectedLevel - 1].requiredBet).toLocaleString('ko-KR') : '0'}
                </p>
              </div>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm',
                currentLevel >= selectedLevel
                  ? 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border border-green-200'
                  : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
              )}>
                {currentLevel >= selectedLevel ? '달성 완료' : '미달성'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
              <div>
                <p className="text-[13px] font-extrabold text-[#1e293b]">유지 누적 입금 <span className="text-[#94a3b8] font-bold">(90일)</span></p>
                <p className="text-[12px] font-bold text-[#64748b] mt-0.5">유지 조건</p>
              </div>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm',
                currentLevel >= selectedLevel
                  ? 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border border-green-200'
                  : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
              )}>
                {currentLevel >= selectedLevel ? '달성 완료' : '미달성'}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white border border-[#e2e8f0] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-md">
              <div>
                <p className="text-[13px] font-extrabold text-[#1e293b]">유지 베팅 조건 <span className="text-[#94a3b8] font-bold">(90일)</span></p>
                <p className="text-[12px] font-bold text-[#64748b] mt-0.5">유지 조건</p>
              </div>
              <span className={cn(
                'rounded-lg px-2.5 py-1 text-[11px] font-black shadow-sm',
                currentLevel >= selectedLevel
                  ? 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border border-green-200'
                  : 'bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] text-[#64748b] border border-[#e2e8f0]'
              )}>
                {currentLevel >= selectedLevel ? '달성 완료' : '미달성'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* VIP Exclusive Benefits */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h3 className="text-[15px] font-black text-[#1e293b] flex items-center gap-2">
            <span className="text-[18px]">💎</span> VIP {selectedLevel} Exclusive Benefits
          </h3>
        </div>
        <div className="p-5 bg-[#fbfcfd]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {VIP_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              const value = benefitValues[benefit.key] || '-';
              return (
                <div
                  key={benefit.key}
                  className="flex flex-col items-center gap-2.5 rounded-xl border border-[#cbd5e1] bg-gradient-to-b from-white to-[#f8fafc] p-4 text-center shadow-[0_2px_4px_rgba(0,0,0,0.02),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-[#fef3c7] to-[#fde68a] border border-[#fcd34d] shadow-[inset_0_2px_4px_rgba(255,255,255,1)]">
                    <Icon className="size-5 text-[#f59e0b] drop-shadow-sm" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-extrabold text-[#64748b] leading-tight mt-1">{benefit.label}</p>
                    <p className="text-[14px] font-black text-[#f59e0b] drop-shadow-sm">{value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* All VIP Levels Comparison */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h3 className="text-[15px] font-black text-[#1e293b] flex items-center gap-2">
            <span className="text-[18px]">📊</span> 전체 VIP 등급 비교
          </h3>
        </div>
        <div className="overflow-x-auto bg-[#fbfcfd] p-5">
          <div className="rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  <th className="px-4 py-3 text-left text-[12px] font-extrabold text-[#64748b]">등급</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">필요 베팅</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">캐시백</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">일일 보너스</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">주간 보너스</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">월간 보너스</th>
                  <th className="px-4 py-3 text-right text-[12px] font-extrabold text-[#64748b]">생일 보너스</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {levels.map((level) => {
                  const display = VIP_DISPLAY[level.level] || VIP_DISPLAY[1];
                  const isCurrent = level.level === currentLevel;
                  const values = FALLBACK_BENEFIT_VALUES[level.level] || FALLBACK_BENEFIT_VALUES[1];
                  return (
                    <tr
                      key={level.level}
                      className={cn(
                        'border-b border-[#e2e8f0] transition-colors hover:bg-[#f8fafc]',
                        isCurrent && 'bg-amber-50/50 relative'
                      )}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl drop-shadow-sm">{display.icon}</span>
                          <span className={cn('font-black text-[13px]', isCurrent ? 'text-[#f59e0b]' : 'text-[#334155]')}>
                            VIP {level.level}
                          </span>
                          {isCurrent && (
                            <span className="rounded-md bg-gradient-to-r from-[#f59e0b] to-[#d97706] px-2 py-0.5 text-[10px] font-black text-white shadow-sm">
                              현재
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#475569]">
                        {Number(level.requiredBet).toLocaleString('ko-KR')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-[#f59e0b] drop-shadow-sm">{level.cashbackRate}%</td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#475569]">{values.dailyBonus}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#475569]">{values.weeklyBonus}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#475569]">{values.monthlyBonus}</td>
                      <td className="px-4 py-3.5 text-right font-bold text-[#475569]">{values.birthdayBonus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
