'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

const SEGMENT_COLORS = [
  'bg-red-600',
  'bg-blue-600',
  'bg-green-600',
  'bg-yellow-600',
  'bg-purple-600',
  'bg-pink-600',
  'bg-cyan-600',
  'bg-orange-600',
];

const SEGMENT_BORDER_COLORS = [
  'border-red-500',
  'border-blue-500',
  'border-green-500',
  'border-yellow-500',
  'border-purple-500',
  'border-pink-500',
  'border-cyan-500',
  'border-orange-500',
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

  const prizes = spinStatus?.prizes || [];
  const segmentCount = prizes.length || 8;
  const segmentAngle = 360 / segmentCount;

  const handleSpin = useCallback(async () => {
    if (isAnimatingRef.current) return;
    setError('');

    try {
      isAnimatingRef.current = true;

      const result = await executeSpin();

      // Find target segment index
      const targetIndex = prizes.findIndex((p) => p.name === result.prizeName);
      const targetSegment = targetIndex >= 0 ? targetIndex : 0;

      // Calculate target angle (segment center)
      // The wheel spins, and the pointer is at the top (0 degrees)
      // We need the target segment to align with the top
      const segmentCenter = targetSegment * segmentAngle + segmentAngle / 2;
      const fullRotations = (3 + Math.random() * 2) * 360; // 3-5 full rotations
      const targetRotation = rotation + fullRotations + (360 - segmentCenter);

      setRotation(targetRotation);

      // Show result after animation
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
  const canSpin = todayCount < maxCount && !isSpinning && !isAnimatingRef.current;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">럭키스핀</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              오늘 남은 횟수
            </p>
            <p className="text-lg font-bold">
              <span className={cn(todayCount >= maxCount && 'text-destructive')}>
                {maxCount - todayCount}
              </span>
              <span className="text-muted-foreground">/{maxCount}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spin wheel */}
      <Card>
        <CardContent className="flex flex-col items-center gap-6 pt-6">
          {/* Wheel container */}
          <div className="relative">
            {/* Pointer triangle */}
            <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2">
              <div className="size-0 border-x-[12px] border-t-[20px] border-x-transparent border-t-primary" />
            </div>

            {/* Wheel */}
            <div
              ref={wheelRef}
              className="relative size-[280px] overflow-hidden rounded-full border-4 border-primary/50 shadow-[0_0_30px_rgba(233,69,96,0.3)] sm:size-[320px]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning || isAnimatingRef.current
                  ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                  : 'none',
              }}
            >
              {prizes.length > 0 ? (
                prizes.map((prize, i) => {
                  const startAngle = i * segmentAngle;
                  const midAngle = startAngle + segmentAngle / 2;
                  // Use conic gradient segments
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
                      {/* Label */}
                      <div
                        className="absolute left-1/2 top-0 origin-bottom"
                        style={{
                          height: '50%',
                          transform: `rotate(${midAngle}deg) translateX(-50%)`,
                        }}
                      >
                        <span className="inline-block -rotate-0 pt-3 text-[10px] font-bold text-white drop-shadow sm:text-xs">
                          {prize.name}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                // Default 8-segment placeholder
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
              <div className="absolute left-1/2 top-1/2 z-10 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-card shadow-lg sm:size-14">
                <span className="text-lg font-bold">🎡</span>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Spin button */}
          <Button
            size="lg"
            onClick={handleSpin}
            disabled={!canSpin}
            className="w-full max-w-xs text-base font-bold"
          >
            {isSpinning ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin" />
                스핀 중...
              </>
            ) : todayCount >= maxCount ? (
              '오늘 횟수를 모두 사용했습니다'
            ) : (
              '스핀!'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Today's spin history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">오늘의 당첨 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {spinHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
              <span className="text-2xl">🏆</span>
              <p className="text-sm text-muted-foreground">
                아직 스핀 기록이 없습니다
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {spinHistory.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2"
                >
                  <span className="text-sm text-muted-foreground">
                    {i + 1}회
                  </span>
                  <span className="text-sm font-medium">
                    {item.name} ({Number(item.amount).toLocaleString('ko-KR')}P)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Prize list */}
      {prizes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">상품 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {prizes.map((prize, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-lg border p-3',
                    SEGMENT_BORDER_COLORS[i % SEGMENT_BORDER_COLORS.length],
                    'bg-card/50'
                  )}
                >
                  <span className="text-xs text-muted-foreground">{prize.name}</span>
                  <span className="text-sm font-bold">
                    {Number(prize.amount).toLocaleString('ko-KR')}
                    {prize.rewardType === 'point' ? 'P' : prize.rewardType === 'cash' ? '원' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
            <p className="text-lg font-bold">
              {lastSpinResult?.prizeName}
            </p>
            {lastSpinResult?.rewardType !== 'none' && (
              <p className="text-2xl font-bold text-yellow-400">
                +{Number(lastSpinResult?.amount || 0).toLocaleString('ko-KR')}
                {lastSpinResult?.rewardType === 'point' ? 'P' : '원'}
              </p>
            )}
          </div>
          <Button onClick={() => setShowResult(false)} className="w-full">
            확인
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
