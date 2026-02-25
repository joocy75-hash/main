'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const REWARD_TABLE = [
  { deposit: '0', bet: '0', days: ['1,000P', '2,000P', '2,500P', '3,000P', '3,500P', '4,000P', '5,000P'], weekBonus: '10,000P' },
  { deposit: '50,000', bet: '50,000', days: ['2,000P', '3,000P', '3,500P', '4,000P', '4,500P', '5,000P', '8,000P'], weekBonus: '15,000P' },
];

export default function AttendancePage() {
  const {
    attendanceStatus,
    isCheckingIn,
    isLoading,
    fetchAttendanceStatus,
    checkIn,
  } = useEventStore();

  const [checkInResult, setCheckInResult] = useState<{ dayNumber: number; reward: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckIn = useCallback(async () => {
    setError('');
    setCheckInResult(null);
    try {
      const result = await checkIn();
      setCheckInResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '출석 체크에 실패했습니다');
    }
  }, [checkIn]);

  const consecutiveDays = attendanceStatus?.consecutiveDays || 0;
  const checkedToday = attendanceStatus?.checkedToday || false;
  const nextReward = attendanceStatus?.nextReward;

  const checkedDaysSet = new Set(
    attendanceStatus?.monthLogs?.map((log) => {
      const d = new Date(log.date);
      return d.getDay();
    }) || []
  );

  // 7-day check-in display (kzkzb style: 6 regular + 1 bonus)
  const dayLabels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];

  return (
    <div className="flex flex-col gap-4">
      {/* Banner - kzkzb style large header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-blue-500 to-cyan-400 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white md:text-5xl">Check-in</h1>
          <p className="mt-2 text-base text-white/80 md:text-lg">
            and earn up to <span className="font-bold text-white">₩100,000</span>
          </p>
          <p className="text-base text-white/80 md:text-lg">Rewards!</p>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 text-7xl opacity-20 md:text-8xl">📅</div>
        <div className="absolute right-16 bottom-2 text-5xl opacity-20 md:text-6xl">🔔</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
      </div>

      {/* Check-in status card */}
      <div className="rounded-xl bg-white p-6">
        {/* Current reward info */}
        <div className="mb-6 text-center">
          <p className="text-sm text-[#707070]">Check in now to get</p>
          <p className="text-2xl font-bold text-[#f4b53e]">
            {nextReward
              ? `₩${Number(nextReward.amount).toLocaleString('ko-KR')}`
              : '₩1,000'
            }
          </p>
        </div>

        {/* 7-day grid (kzkzb: 6 + 1 layout) */}
        <div className="flex items-stretch gap-2">
          {/* Day 1-6: regular cells */}
          {dayLabels.slice(0, 6).map((label, i) => {
            const dayNum = i + 1;
            const isChecked = dayNum <= consecutiveDays;
            return (
              <div
                key={label}
                className={cn(
                  'flex flex-1 flex-col items-center justify-center rounded-lg py-4 transition-all',
                  isChecked
                    ? 'bg-emerald-500/20'
                    : 'bg-[#edeef3]/50'
                )}
              >
                {isChecked ? (
                  <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/30">
                    <Check className="size-5 text-green-600" />
                  </div>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#edeef3]/50">
                    <Check className="size-5 text-[#707070]/30" />
                  </div>
                )}
                <span className="mt-2 text-xs font-medium uppercase text-[#707070]">
                  {label}
                </span>
              </div>
            );
          })}

          {/* Day 7: bonus day (kzkzb: wider, amber bg) */}
          <div
            className={cn(
              'flex flex-[1.5] flex-col items-center justify-center rounded-lg py-4 transition-all',
              consecutiveDays >= 7
                ? 'bg-[#f4b53e]/30'
                : 'bg-[#f4b53e]/10 border border-[#f4b53e]/20'
            )}
          >
            {consecutiveDays >= 7 ? (
              <div className="flex size-10 items-center justify-center rounded-full bg-[#f4b53e]/40">
                <Check className="size-5 text-[#f4b53e]" />
              </div>
            ) : (
              <Gift className="size-10 text-[#f4b53e]" />
            )}
            <span className="mt-2 text-sm font-bold uppercase text-[#f4b53e]">
              Day 7
            </span>
          </div>
        </div>

        {/* Check-in button (kzkzb: full width, rounded-full, amber bg) */}
        <div className="mt-6">
          {checkInResult && (
            <div className="mb-4 rounded-lg bg-emerald-500/10 p-3 text-center">
              <p className="text-sm font-medium text-green-600">
                {checkInResult.dayNumber}일차 출석 완료!
              </p>
              <p className="mt-1 text-lg font-bold text-green-500">
                +{Number(checkInResult.reward).toLocaleString('ko-KR')}P
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-center">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          <button
            onClick={handleCheckIn}
            disabled={isCheckingIn || checkedToday || isLoading}
            className={cn(
              'w-full rounded-full py-4 text-lg font-bold transition-all',
              checkedToday
                ? 'cursor-not-allowed bg-[#edeef3] text-[#707070]'
                : 'bg-[#f4b53e] text-black hover:bg-[#f4b53e]/90 active:scale-[0.98]'
            )}
          >
            {isCheckingIn ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                처리 중...
              </span>
            ) : checkedToday ? (
              <span className="flex items-center justify-center gap-2">
                <Check className="size-5" />
                오늘 출석 완료!
              </span>
            ) : (
              'Check-In Now'
            )}
          </button>
        </div>
      </div>

      {/* Reward table (kzkzb style: amber header) */}
      <div className="rounded-xl bg-white p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f4b53e]/90 text-black">
                <th className="rounded-tl-lg px-3 py-2.5 text-left text-xs font-semibold">
                  Deposit / Bet
                </th>
                {dayLabels.map((d) => (
                  <th key={d} className="px-2 py-2.5 text-center text-xs font-semibold">
                    {d}
                  </th>
                ))}
                <th className="rounded-tr-lg px-2 py-2.5 text-center text-xs font-semibold">
                  Weekly Bonus
                </th>
              </tr>
            </thead>
            <tbody>
              {REWARD_TABLE.map((row, idx) => (
                <tr
                  key={idx}
                  className={cn(
                    'border-b border-[#dddddd]/30',
                    idx % 2 === 0 ? 'bg-[#edeef3]/20' : 'bg-[#edeef3]/10'
                  )}
                >
                  <td className="px-3 py-2.5 text-xs">
                    <span className="text-[#707070]">≥</span> ₩{row.deposit} / <span className="text-[#707070]">≥</span> ₩{row.bet}
                  </td>
                  {row.days.map((val, di) => (
                    <td key={di} className="px-2 py-2.5 text-center text-xs font-medium">
                      {val}
                    </td>
                  ))}
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-block rounded bg-[#f4b53e]/20 px-2 py-0.5 text-xs font-bold text-[#f4b53e]">
                      Extra Bonus {row.weekBonus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-center text-xs text-[#707070]">
          Check in 7 days bonus
        </p>
      </div>

      {/* Consecutive days info */}
      <div className="rounded-xl bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#707070]">연속 출석</p>
            <p className="text-xl font-bold">
              {consecutiveDays}일째
              {consecutiveDays >= 3 && <span className="ml-1">🔥</span>}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#707070]">이번 달 출석</p>
            <p className="text-xl font-bold">
              {attendanceStatus?.monthLogs?.length || 0}일
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
