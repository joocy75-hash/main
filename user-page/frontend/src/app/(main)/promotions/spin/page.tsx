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
  'bg-gradient-to-br from-[#ef4444] to-[#991b1b]', // Red
  'bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a]', // Blue
  'bg-gradient-to-br from-[#10b981] to-[#047857]', // Emerald
  'bg-gradient-to-br from-[#f59e0b] to-[#b45309]', // Amber
  'bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95]', // Purple
  'bg-gradient-to-br from-[#ec4899] to-[#be185d]', // Pink
  'bg-gradient-to-br from-[#06b6d4] to-[#0f766e]', // Cyan
  'bg-gradient-to-br from-[#f97316] to-[#c2410c]', // Orange
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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h1 className="text-lg font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
            <span className="text-xl">🎰</span> 럭키스핀
          </h1>
        </div>
        <div className="px-5 py-4 bg-[#fbfcfd] flex items-center justify-between">
          <p className="text-[14px] font-extrabold text-[#64748b]">오늘 남은 횟수</p>
          <div className="flex items-baseline gap-1 bg-[#f1f5f9] px-3 py-1.5 rounded-lg border border-[#e2e8f0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <span className={cn('text-[18px] font-black', todayCount >= maxCount ? 'text-red-500' : 'text-[#f59e0b]')}>
              {Math.max(0, maxCount - todayCount)}
            </span>
            <span className="text-[13px] font-bold text-[#94a3b8]">/ {maxCount}</span>
          </div>
        </div>
      </div>

      {/* Spin wheel container */}
      <div className="flex flex-col items-center gap-8 rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#f8fafc] to-transparent"></div>
        
        {/* Wheel wrapper */}
        <div className="relative z-10 mt-4">
          {/* Pointer */}
          <div className="absolute -top-6 left-1/2 z-20 -translate-x-1/2 drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]">
            <div className="size-0 border-x-[16px] border-t-[28px] border-x-transparent border-t-[#ef4444] relative z-10" />
            {/* 3D effect for pointer */}
            <div className="absolute top-0 left-[-12px] size-0 border-x-[12px] border-t-[24px] border-x-transparent border-t-[#dc2626] -z-10" />
            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 w-8 h-4 bg-[#ef4444] rounded-t-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]" />
          </div>

          {/* Wheel Background Shadow */}
          <div className="absolute inset-0 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.15),_0_5px_15px_rgba(0,0,0,0.1)] -z-10 bg-black/5 translate-y-3 blur-sm"></div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="relative size-[280px] sm:size-[340px] overflow-hidden rounded-full border-[8px] border-[#1e293b] shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] bg-[#0f172a]"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning
                ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                : 'none',
            }}
          >
            {/* Inner rim reflection */}
            <div className="absolute inset-0 rounded-full border-[3px] border-white/10 z-20 pointer-events-none"></div>

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
                    >
                      {/* Gradient overlay for 3D slice effect */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_60%)]"></div>
                    </div>
                    <div
                      className="absolute left-1/2 top-0 origin-bottom"
                      style={{
                        height: '50%',
                        transform: `rotate(${midAngle}deg) translateX(-50%)`,
                      }}
                    >
                      <span className="inline-block pt-6 sm:pt-8 text-[11px] sm:text-[13px] font-black tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
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
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                    </div>
                    <div
                      className="absolute left-1/2 top-0 origin-bottom"
                      style={{
                        height: '50%',
                        transform: `rotate(${midAngle}deg) translateX(-50%)`,
                      }}
                    >
                      <span className="inline-block pt-6 sm:pt-8 text-[11px] sm:text-[13px] font-black tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                        {labels[i]}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            {/* Wheel center pin */}
            <div className="absolute left-1/2 top-1/2 z-30 flex size-14 sm:size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-[#334155] bg-gradient-to-b from-[#1e293b] to-[#0f172a] shadow-[0_5px_15px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.2)]">
              <div className="size-6 sm:size-8 rounded-full bg-gradient-to-br from-[#f59e0b] to-[#d97706] shadow-[inset_0_2px_4px_rgba(255,255,255,0.5)] border border-[#fbbf24]"></div>
            </div>
            {/* Studs */}
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className="absolute w-2 h-2 rounded-full bg-yellow-400 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.5),_inset_0_1px_1px_rgba(255,255,255,0.8)]"
                style={{
                  top: `calc(50% - 130px * ${Math.cos((i * 30 * Math.PI) / 180)})`,
                  left: `calc(50% + 130px * ${Math.sin((i * 30 * Math.PI) / 180)})`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-red-50/50 p-4 shadow-sm">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
            <p className="text-[13px] font-bold text-red-600 text-center">{error}</p>
          </div>
        )}

        {/* Spin button */}
        <button
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          className={cn(
            'w-full max-w-[280px] rounded-2xl px-8 py-4 text-[18px] font-black text-white transition-all flex items-center justify-center gap-2 mt-2 h-[60px]',
            (!canSpin || isSpinning)
              ? 'bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-[#94a3b8] cursor-not-allowed shadow-none border border-[#cbd5e1]'
              : 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_6px_10px_rgba(245,158,11,0.3)] hover:translate-y-[1px] hover:shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_4px_8px_rgba(245,158,11,0.3)]'
          )}
        >
          {isSpinning ? (
            <>
              <Loader2 className="size-6 animate-spin drop-shadow-sm" />
              스핀 중...
            </>
          ) : todayCount >= maxCount ? (
            '기회 소진'
          ) : (
            <>
              <span className="drop-shadow-sm">스핀 돌리기</span>
              <span className="text-xl">🎯</span>
            </>
          )}
        </button>
      </div>

      {/* Prize list (Moved up to be more visible before history) */}
      {prizes.length > 0 && (
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
          <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
            <h2 className="text-[15px] font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
              <span className="text-[18px]">🎁</span> 상품 목록
            </h2>
          </div>
          <div className="p-5 bg-[#fbfcfd]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {prizes.map((prize, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#cbd5e1] bg-gradient-to-b from-white to-[#f8fafc] p-3 shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.02)] transition-transform hover:scale-105"
                >
                  <span className="text-[12px] font-extrabold text-[#64748b]">{prize.name}</span>
                  <span className="text-[15px] font-black text-[#f59e0b] drop-shadow-sm">
                    {Number(prize.amount).toLocaleString('ko-KR')}
                    {prize.rewardType === 'point' ? 'P' : prize.rewardType === 'cash' ? '원' : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Today's spin history */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h2 className="text-[15px] font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
            <span className="text-[18px]">🏅</span> 오늘의 당첨 기록
          </h2>
        </div>
        <div className="p-5 bg-[#fbfcfd]">
          {spinHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 text-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc]">
              <span className="text-3xl opacity-50 grayscale">🏆</span>
              <p className="text-[13px] font-extrabold text-[#94a3b8]">아직 스핀 기록이 없습니다</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {spinHistory.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-[#f1f5f9] text-[12px] font-black text-[#64748b]">
                      {i + 1}
                    </span>
                    <span className="text-[14px] font-black text-[#1e293b]">{item.name}</span>
                  </div>
                  <span className="rounded-lg bg-orange-50 px-2.5 py-1 text-[13px] font-black text-[#f59e0b]">
                    + {Number(item.amount).toLocaleString('ko-KR')}P
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Result dialog */}
      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-sm sm:max-w-[400px] border-none bg-transparent shadow-none p-0">
          <div className="rounded-2xl bg-white/95 backdrop-blur-xl shadow-[0_25px_50px_rgba(0,0,0,0.25),_inset_0_2px_0_rgba(255,255,255,0.5)] border border-white/50 overflow-hidden relative">
            {lastSpinResult?.rewardType !== 'none' && (
              <div className="absolute inset-0 bg-gradient-to-b from-yellow-100/30 to-transparent -z-10 pointer-events-none"></div>
            )}
            <DialogHeader className="pt-8 pb-4">
              <DialogTitle className="text-center text-2xl font-black drop-shadow-sm">
                {lastSpinResult?.rewardType === 'none' ? (
                  <span className="text-[#64748b]">아쉽네요! 😢</span>
                ) : (
                  <span className="bg-gradient-to-r from-[#f59e0b] to-[#d97706] bg-clip-text text-transparent">당첨을 축하합니다! 🎉</span>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-6 px-8">
              <div className="flex size-24 items-center justify-center rounded-3xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] shadow-[inset_0_-4px_0_rgba(0,0,0,0.05),_0_8px_16px_rgba(0,0,0,0.1)] mb-2 relative transform transition-transform hover:scale-110">
                <span className="text-5xl drop-shadow-md">
                  {lastSpinResult?.rewardType === 'none' ? '💨' : '🏆'}
                </span>
                {lastSpinResult?.rewardType !== 'none' && (
                  <div className="absolute -top-2 -right-2 size-8 bg-[#ef4444] rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
                    <span className="text-white text-xs font-black">HIT</span>
                  </div>
                )}
              </div>
              <p className="text-[18px] font-black text-[#1e293b]">
                {lastSpinResult?.prizeName}
              </p>
              {lastSpinResult?.rewardType !== 'none' && (
                <p className="text-3xl font-black text-[#10b981] drop-shadow-sm">
                  +{Number(lastSpinResult?.amount || 0).toLocaleString('ko-KR')}
                  <span className="text-xl ml-1">{lastSpinResult?.rewardType === 'point' ? 'P' : '원'}</span>
                </p>
              )}
            </div>
            <div className="p-6 bg-[#f8fafc] border-t border-[#e2e8f0]">
              <button
                onClick={() => setShowResult(false)}
                className="w-full rounded-2xl bg-gradient-to-b from-[#f59e0b] to-[#d97706] px-8 py-4 text-[16px] font-black text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_0_6px_10px_rgba(245,158,11,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_8px_15px_rgba(245,158,11,0.4)]"
              >
                확인
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
