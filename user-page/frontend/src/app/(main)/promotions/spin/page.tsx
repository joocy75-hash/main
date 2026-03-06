'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const SEGMENT_COLORS = [
  'bg-red-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-cyan-500',
  'bg-orange-500',
];

export default function SpinPage() {
  const {
    spinStatus,
    lastSpinResult,
    isSpinning,
    fetchSpinStatus,
    executeSpin,
  } = useEventStore();

  const [rotation, setRotation] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [error, setError] = useState('');
  const [spinHistory, setSpinHistory] = useState<{ name: string; amount: string }[]>([]);
  const wheelRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    fetchSpinStatus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const prizes = useMemo(() => spinStatus?.prizes || [], [spinStatus?.prizes]);
  const segmentCount = prizes.length || 8;
  const segmentAngle = 360 / segmentCount;

  const handleSpin = useCallback(async () => {
    if (isAnimatingRef.current) return;
    setError('');

    try {
      isAnimatingRef.current = true;

      const result = await executeSpin();

      const targetIndex = prizes.findIndex((p) => p.name === result.prizeName);
      const targetSegment = targetIndex >= 0 ? targetIndex : 0;

      const segmentCenter = targetSegment * segmentAngle + segmentAngle / 2;
      const fullRotations = (3 + Math.random() * 2) * 360;
      const targetRotation = rotation + fullRotations + (360 - segmentCenter);

      setRotation(targetRotation);

      setTimeout(() => {
        setShowResult(true);
        isAnimatingRef.current = false;
        useEventStore.setState({ isSpinning: false });

        if (result.rewardType !== 'none') {
          setSpinHistory((prev) => [
            { name: result.prizeName, amount: result.amount },
            ...prev.slice(0, 9),
          ]);
        }
      }, 4000);
    } catch (err) {
      isAnimatingRef.current = false;
      useEventStore.setState({ isSpinning: false });
      setError(err instanceof Error ? err.message : '스핀 실행에 실패했습니다');
    }
  }, [executeSpin, prizes, segmentAngle, rotation]);

  const todayCount = spinStatus?.todayCount || 0;
  const maxCount = spinStatus?.maxCount || 3;
  const canSpin = todayCount < maxCount && !isSpinning;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h1 className="text-lg font-bold text-[#252531]">럭키스핀</h1>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-[#6b7280]">오늘 남은 횟수</p>
          <p className="text-lg font-bold text-[#252531]">
            <span className={cn(todayCount >= maxCount && 'text-red-500')}>
              {maxCount - todayCount}
            </span>
            <span className="text-[#6b7280]">/{maxCount}</span>
          </p>
        </div>
      </div>

      {/* Spin wheel */}
      <div className="flex flex-col items-center gap-6 rounded-lg bg-[#f5f5f7] p-6">
        {/* Wheel container */}
        <div className="relative">
          {/* Pointer triangle */}
          <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
            <div className="size-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-[#feb614]" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="relative size-[280px] overflow-hidden rounded-full border-4 border-[#feb614]/60 shadow-lg sm:size-[320px]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
            }}
          >
            {prizes.length > 0 ? (
              prizes.map((prize, i) => {
                const startAngle = i * segmentAngle;
                const midAngle = startAngle + segmentAngle / 2;
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin(((startAngle + segmentAngle) * Math.PI) / 180)}% ${50 - 50 * Math.cos(((startAngle + segmentAngle) * Math.PI) / 180)}%)`,
                    }}
                  >
                    <div
                      className={cn(
                        'size-full',
                        SEGMENT_COLORS[i % SEGMENT_COLORS.length]
                      )}
                    />
                    <div
                      className="absolute left-1/2 top-0 origin-bottom"
                      style={{
                        height: '50%',
                        transform: `rotate(${midAngle}deg) translateX(-50%)`,
                      }}
                    >
                      <span className="inline-block pt-3 text-[10px] font-bold text-white drop-shadow sm:text-xs">
                        {prize.name}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              Array.from({ length: 8 }).map((_, i) => {
                const startAngle = i * 45;
                const midAngle = startAngle + 22.5;
                const labels = ['꽝', '100P', '500P', '1,000P', '꽝', '5,000P', '100P', '10,000P'];
                return (
                  <div
                    key={i}
                    className="absolute inset-0"
                    style={{
                      clipPath: `polygon(50% 50%, ${50 + 50 * Math.sin((startAngle * Math.PI) / 180)}% ${50 - 50 * Math.cos((startAngle * Math.PI) / 180)}%, ${50 + 50 * Math.sin(((startAngle + 45) * Math.PI) / 180)}% ${50 - 50 * Math.cos(((startAngle + 45) * Math.PI) / 180)}%)`,
                    }}
                  >
                    <div
                      className={cn(
                        'size-full',
                        SEGMENT_COLORS[i % SEGMENT_COLORS.length]
                      )}
                    />
                    <div
                      className="absolute left-1/2 top-0 origin-bottom"
                      style={{
                        height: '50%',
                        transform: `rotate(${midAngle}deg) translateX(-50%)`,
                      }}
                    >
                      <span className="inline-block pt-3 text-[10px] font-bold text-white drop-shadow sm:text-xs">
                        {labels[i]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Center circle */}
            <div className="absolute left-1/2 top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#feb614] bg-white shadow-lg sm:size-14">
              <span className="text-lg font-bold">🎡</span>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          className="w-full max-w-xs rounded-full bg-gradient-to-b from-[#ffd651] to-[#fe960e] px-8 py-3 text-base font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {isSpinning ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-5 animate-spin" />
              스핀 중...
            </span>
          ) : todayCount >= maxCount ? (
            '오늘 횟수를 모두 사용했습니다'
          ) : (
            '스핀!'
          )}
        </button>
      </div>

      {/* Today's spin history */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h2 className="mb-3 text-base font-bold text-[#252531]">오늘의 당첨 기록</h2>
        {spinHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="text-2xl">🏆</span>
            <p className="text-sm text-[#6b7280]">아직 스핀 기록이 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {spinHistory.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-[#e8e8e8] px-3 py-2"
              >
                <span className="text-sm text-[#6b7280]">{i + 1}회</span>
                <span className="text-sm font-semibold text-[#252531]">
                  {item.name} ({Number(item.amount).toLocaleString('ko-KR')}P)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prize list */}
      {prizes.length > 0 && (
        <div className="rounded-lg bg-[#f5f5f7] p-5">
          <h2 className="mb-3 text-base font-bold text-[#252531]">상품 목록</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {prizes.map((prize, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-lg border border-[#e8e8e8] bg-[#f8f8fa] p-3"
              >
                <span className="text-xs text-[#6b7280]">{prize.name}</span>
                <span className="text-sm font-bold text-[#252531]">
                  {Number(prize.amount).toLocaleString('ko-KR')}
                  {prize.rewardType === 'point' ? 'P' : prize.rewardType === 'cash' ? '원' : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Result dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {lastSpinResult?.rewardType === 'none' ? '😢 아쉽네요!' : '🎉 축하합니다!'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3 py-4">
            <span className="text-4xl">
              {lastSpinResult?.rewardType === 'none' ? '💨' : '🏆'}
            </span>
            <p className="text-lg font-bold text-[#252531]">
              {lastSpinResult?.prizeName}
            </p>
            {lastSpinResult?.rewardType !== 'none' && (
              <p className="text-2xl font-bold text-[#feb614]">
                +{Number(lastSpinResult?.amount || 0).toLocaleString('ko-KR')}
                {lastSpinResult?.rewardType === 'point' ? 'P' : '원'}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowResult(false)}
            className="w-full rounded-full bg-gradient-to-b from-[#ffd651] to-[#fe960e] py-2.5 font-bold text-white"
          >
            확인
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
