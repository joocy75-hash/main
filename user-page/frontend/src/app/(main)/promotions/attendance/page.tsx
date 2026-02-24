'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const DAYS_OF_WEEK = ['일', '월', '화', '수', '목', '금', '토'];

const BONUS_DAYS = [7, 14, 21, 30];

const REWARD_TABLE = [
  { range: '1~6일', reward: '1,000P' },
  { range: '7일 (보너스)', reward: '5,000P' },
  { range: '8~13일', reward: '1,500P' },
  { range: '14일 (보너스)', reward: '10,000P' },
  { range: '15~20일', reward: '2,000P' },
  { range: '21일 (보너스)', reward: '30,000P' },
  { range: '22~29일', reward: '2,500P' },
  { range: '30일 (보너스)', reward: '100,000P' },
];

const DayCell = ({
  day,
  isChecked,
  isToday,
  isBonusDay,
  isPast,
}: {
  day: number;
  isChecked: boolean;
  isToday: boolean;
  isBonusDay: boolean;
  isPast: boolean;
}) => {
  const isFuture = !isChecked && !isToday && !isPast;

  return (
    <div
      className={cn(
        'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-all',
        isChecked && 'border-green-500/50 bg-green-500/10',
        isToday && !isChecked && 'animate-pulse border-yellow-500/50 bg-yellow-500/10',
        isFuture && 'border-border bg-card/50 opacity-50',
        isPast && !isChecked && 'border-border bg-card/30 opacity-40',
        isBonusDay && 'ring-1 ring-yellow-500/40'
      )}
    >
      {isChecked ? (
        <Check className="size-5 text-green-400" />
      ) : isToday ? (
        <span className="text-yellow-400">?</span>
      ) : (
        <span className="text-muted-foreground">{day}</span>
      )}
      <span className="mt-0.5 text-[10px] text-muted-foreground">{day}</span>
      {isBonusDay && (
        <span className="absolute -top-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-black">
          B
        </span>
      )}
    </div>
  );
};

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

  const today = new Date();
  const currentDay = today.getDate();

  // Build 30-day grid data
  const checkedDays = new Set(
    attendanceStatus?.monthLogs?.map((log) => {
      const d = new Date(log.date);
      return d.getDate();
    }) || []
  );

  // Calculate first day offset for calendar grid
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const consecutiveDays = attendanceStatus?.consecutiveDays || 0;
  const checkedToday = attendanceStatus?.checkedToday || false;
  const nextReward = attendanceStatus?.nextReward;

  return (
    <div className="flex flex-col gap-4">
      {/* Header card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">출석체크</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">연속 출석</p>
              <p className="text-2xl font-bold">
                {consecutiveDays}일째
                {consecutiveDays >= 3 && <span className="ml-1">🔥</span>}
              </p>
            </div>
            {nextReward && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">오늘의 보상</p>
                <p className="text-lg font-bold text-yellow-400">
                  {Number(nextReward.amount).toLocaleString('ko-KR')}
                  {nextReward.rewardType === 'point' ? 'P' : '원'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Calendar grid */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {year}년 {month + 1}월
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Day of week headers */}
          <div className="mb-2 grid grid-cols-7 gap-1.5">
            {DAYS_OF_WEEK.map((day) => (
              <div
                key={day}
                className="flex items-center justify-center py-1 text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isChecked = checkedDays.has(day);
              const isToday = day === currentDay;
              const isBonusDay = BONUS_DAYS.includes(day);
              const isPast = day < currentDay;

              return (
                <DayCell
                  key={day}
                  day={day}
                  isChecked={isChecked}
                  isToday={isToday}
                  isBonusDay={isBonusDay}
                  isPast={isPast}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded border border-green-500/50 bg-green-500/10" />
              <span>출석 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 animate-pulse rounded border border-yellow-500/50 bg-yellow-500/10" />
              <span>오늘</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded border border-border ring-1 ring-yellow-500/40" />
              <span>보너스</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Check-in button */}
      <Card>
        <CardContent className="pt-6">
          {checkInResult && (
            <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center">
              <p className="text-sm font-medium text-green-400">
                {checkInResult.dayNumber}일차 출석 완료!
              </p>
              <p className="mt-1 text-lg font-bold text-green-300">
                +{Number(checkInResult.reward).toLocaleString('ko-KR')}P
              </p>
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button
            size="lg"
            onClick={handleCheckIn}
            disabled={isCheckingIn || checkedToday || isLoading}
            className="w-full text-base font-bold"
          >
            {isCheckingIn ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                처리 중...
              </>
            ) : checkedToday ? (
              <>
                <Check className="mr-2 size-5" />
                오늘 출석 완료!
              </>
            ) : (
              '출석 체크하기!'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Reward table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">보상 안내</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {REWARD_TABLE.map((item) => {
              const isBonus = item.range.includes('보너스');
              return (
                <div
                  key={item.range}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm',
                    isBonus
                      ? 'border border-yellow-500/30 bg-yellow-500/5'
                      : 'bg-secondary/30'
                  )}
                >
                  <span className={cn(isBonus && 'font-medium text-yellow-400')}>
                    {item.range}
                  </span>
                  <span className={cn('font-semibold', isBonus ? 'text-yellow-400' : 'text-foreground')}>
                    {item.reward}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
