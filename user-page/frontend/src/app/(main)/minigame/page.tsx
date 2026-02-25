'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMinigameStore } from '@/stores/minigame-store';
import type { BepickRound } from '../../../../../shared/types/minigame';

const REFRESH_INTERVAL = 10_000;
const ROUND_INTERVAL = 300;
const DISPLAY_ROUNDS = 30;

const oddEvenLabel = (v: 1 | 2) => (v === 1 ? '홀' : '짝');
const underOverLabel = (v: 1 | 2) => (v === 1 ? '언더' : '오버');
const smlLabel = (v: 1 | 2 | 3) => (v === 1 ? '소' : v === 2 ? '중' : '대');
const leftRightLabel = (v: 1 | 2) => (v === 1 ? '좌' : '우');
const ladderCountLabel = (v: 1 | 2) => (v === 1 ? '3줄' : '4줄');

const oddEvenColor = (v: 1 | 2) => (v === 1 ? 'text-red-500' : 'text-blue-500');
const underOverColor = (v: 1 | 2) => (v === 1 ? 'text-green-500' : 'text-orange-500');
const smlColor = (v: 1 | 2 | 3) =>
  v === 1 ? 'text-green-500' : v === 2 ? 'text-yellow-500' : 'text-red-500';

const smlBg = (v: 1 | 2 | 3) =>
  v === 1 ? 'bg-green-500/20 text-green-400' : v === 2 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
const oddEvenBg = (v: 1 | 2) =>
  v === 1 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400';
const underOverBg = (v: 1 | 2) =>
  v === 1 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400';

function useCountdown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    const calcRemaining = () => {
      const now = new Date();
      const totalSeconds = now.getMinutes() * 60 + now.getSeconds();
      const elapsed = totalSeconds % ROUND_INTERVAL;
      return ROUND_INTERVAL - elapsed;
    };

    setSecondsLeft(calcRemaining());
    const timer = setInterval(() => {
      setSecondsLeft(calcRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  return { minutes, seconds, secondsLeft };
}

function PowerBallDisplay({ ball }: { ball: number }) {
  const isOdd = ball % 2 === 1;
  return (
    <div
      className={cn(
        'flex size-16 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg sm:size-20 sm:text-3xl',
        isOdd
          ? 'bg-linear-to-br from-red-500 to-red-700 shadow-red-500/30'
          : 'bg-linear-to-br from-blue-500 to-blue-700 shadow-blue-500/30'
      )}
    >
      {ball}
    </div>
  );
}

function NormalBall({ number }: { number: number }) {
  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-linear-to-br from-zinc-600 to-zinc-800 text-sm font-bold text-white shadow-md sm:size-12 sm:text-base">
      {number}
    </div>
  );
}

function StatBar({ label, items }: { label: string; items: { name: string; pct: number; color: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {items.map((item) => (
          <div
            key={item.name}
            className={cn('flex items-center justify-center text-[10px] font-bold text-white transition-all', item.color)}
            style={{ width: `${Math.max(item.pct, 5)}%` }}
          >
            {item.name} {Math.round(item.pct)}%
          </div>
        ))}
      </div>
    </div>
  );
}

function PowerBallTab({ rounds, currentRound }: { rounds: BepickRound[]; currentRound: BepickRound | null }) {
  const { minutes, seconds } = useCountdown();

  const stats = useMemo(() => {
    if (rounds.length === 0) return null;

    let pOdd = 0, pEven = 0, pUnder = 0, pOver = 0;
    let nOdd = 0, nEven = 0, nUnder = 0, nOver = 0;
    let nSmall = 0, nMedium = 0, nLarge = 0;
    const total = rounds.length;

    for (const r of rounds) {
      const pb = r.PowerBall;
      if (pb.pOddEven === 1) pOdd++; else pEven++;
      if (pb.pUnderOver === 1) pUnder++; else pOver++;
      if (pb.nOddEven === 1) nOdd++; else nEven++;
      if (pb.nUnderOver === 1) nUnder++; else nOver++;
      if (pb.nSML === 1) nSmall++; else if (pb.nSML === 2) nMedium++; else nLarge++;
    }

    return {
      pOddPct: (pOdd / total) * 100,
      pEvenPct: (pEven / total) * 100,
      pUnderPct: (pUnder / total) * 100,
      pOverPct: (pOver / total) * 100,
      nOddPct: (nOdd / total) * 100,
      nEvenPct: (nEven / total) * 100,
      nUnderPct: (nUnder / total) * 100,
      nOverPct: (nOver / total) * 100,
      nSmallPct: (nSmall / total) * 100,
      nMediumPct: (nMedium / total) * 100,
      nLargePct: (nLarge / total) * 100,
    };
  }, [rounds]);

  const pb = currentRound?.PowerBall;

  return (
    <div className="flex flex-col gap-4">
      {/* Current round info */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                </span>
                LIVE
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {currentRound ? `${currentRound.AllRound.toLocaleString()}회` : '---'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">다음 추첨</span>
              <span className="font-mono text-base font-bold text-primary">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {pb ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              {/* Power Ball */}
              <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4">
                <span className="text-xs font-medium text-muted-foreground">파워볼</span>
                <PowerBallDisplay ball={pb.pBall} />
                <div className="flex gap-2">
                  <Badge className={oddEvenBg(pb.pOddEven)}>{oddEvenLabel(pb.pOddEven)}</Badge>
                  <Badge className={underOverBg(pb.pUnderOver)}>{underOverLabel(pb.pUnderOver)}</Badge>
                  <Badge variant="outline">{pb.pBallType}구간</Badge>
                </div>
              </div>

              {/* Normal Balls */}
              <div className="flex flex-1 flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4">
                <span className="text-xs font-medium text-muted-foreground">일반볼</span>
                <div className="flex gap-2">
                  <NormalBall number={pb.nBall1} />
                  <NormalBall number={pb.nBall2} />
                  <NormalBall number={pb.nBall3} />
                  <NormalBall number={pb.nBall4} />
                  <NormalBall number={pb.nBall5} />
                </div>
                <div className="text-lg font-bold">
                  합계: <span className="text-primary">{pb.nBallSum}</span>
                </div>
                <div className="flex gap-2">
                  <Badge className={oddEvenBg(pb.nOddEven)}>{oddEvenLabel(pb.nOddEven)}</Badge>
                  <Badge className={underOverBg(pb.nUnderOver)}>{underOverLabel(pb.nUnderOver)}</Badge>
                  <Badge className={smlBg(pb.nSML)}>{smlLabel(pb.nSML)}</Badge>
                  <Badge variant="outline">{pb.nBallType}구간</Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:gap-6">
              <Skeleton className="size-20 rounded-full" />
              <div className="flex gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="size-12 rounded-full" />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">최근 결과 ({DISPLAY_ROUNDS}회차)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="px-2 py-2 text-left text-xs font-medium">회차</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">파워볼</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">홀짝</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">언오</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">일반합</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">홀짝</th>
                  <th className="px-2 py-2 text-center text-xs font-medium">소중대</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : (
                  rounds.slice(0, DISPLAY_ROUNDS).map((r) => {
                    const p = r.PowerBall;
                    return (
                      <tr key={r.ID} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                        <td className="px-2 py-2 text-left font-mono text-xs text-muted-foreground">{r.Round}</td>
                        <td className="px-2 py-2 text-center">
                          <span className={cn(
                            'inline-flex size-7 items-center justify-center rounded-full text-xs font-bold text-white',
                            p.pBall % 2 === 1 ? 'bg-red-600' : 'bg-blue-600'
                          )}>
                            {p.pBall}
                          </span>
                        </td>
                        <td className={cn('px-2 py-2 text-center text-xs font-bold', oddEvenColor(p.pOddEven))}>
                          {oddEvenLabel(p.pOddEven)}
                        </td>
                        <td className={cn('px-2 py-2 text-center text-xs font-bold', underOverColor(p.pUnderOver))}>
                          {underOverLabel(p.pUnderOver)}
                        </td>
                        <td className="px-2 py-2 text-center font-mono text-xs font-bold">{p.nBallSum}</td>
                        <td className={cn('px-2 py-2 text-center text-xs font-bold', oddEvenColor(p.nOddEven))}>
                          {oddEvenLabel(p.nOddEven)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <span className={cn('inline-block rounded px-1.5 py-0.5 text-[10px] font-bold', smlBg(p.nSML))}>
                            {smlLabel(p.nSML)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats panel */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">통계 ({DISPLAY_ROUNDS}회 기준)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <StatBar
              label="파워볼 홀/짝"
              items={[
                { name: '홀', pct: stats.pOddPct, color: 'bg-red-600' },
                { name: '짝', pct: stats.pEvenPct, color: 'bg-blue-600' },
              ]}
            />
            <StatBar
              label="파워볼 언더/오버"
              items={[
                { name: '언더', pct: stats.pUnderPct, color: 'bg-green-600' },
                { name: '오버', pct: stats.pOverPct, color: 'bg-orange-600' },
              ]}
            />
            <StatBar
              label="일반볼합 홀/짝"
              items={[
                { name: '홀', pct: stats.nOddPct, color: 'bg-red-600' },
                { name: '짝', pct: stats.nEvenPct, color: 'bg-blue-600' },
              ]}
            />
            <StatBar
              label="일반볼합 언더/오버"
              items={[
                { name: '언더', pct: stats.nUnderPct, color: 'bg-green-600' },
                { name: '오버', pct: stats.nOverPct, color: 'bg-orange-600' },
              ]}
            />
            <StatBar
              label="소/중/대"
              items={[
                { name: '소', pct: stats.nSmallPct, color: 'bg-green-600' },
                { name: '중', pct: stats.nMediumPct, color: 'bg-yellow-600' },
                { name: '대', pct: stats.nLargePct, color: 'bg-red-600' },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PowerLadderTab({ rounds, currentRound }: { rounds: BepickRound[]; currentRound: BepickRound | null }) {
  const { minutes, seconds } = useCountdown();
  const pl = currentRound?.PowerLadder;

  const stats = useMemo(() => {
    if (rounds.length === 0) return null;

    let left = 0, right = 0, line3 = 0, line4 = 0, odd = 0, even = 0;
    const total = rounds.length;

    for (const r of rounds) {
      const ladder = r.PowerLadder;
      if (ladder.leftRight === 1) left++; else right++;
      if (ladder.ladderCount === 1) line3++; else line4++;
      if (ladder.oddEven === 1) odd++; else even++;
    }

    return {
      leftPct: (left / total) * 100,
      rightPct: (right / total) * 100,
      line3Pct: (line3 / total) * 100,
      line4Pct: (line4 / total) * 100,
      oddPct: (odd / total) * 100,
      evenPct: (even / total) * 100,
    };
  }, [rounds]);

  return (
    <div className="flex flex-col gap-4">
      {/* Current round */}
      <Card>
        <CardContent className="pt-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="gap-1">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-white" />
                </span>
                LIVE
              </Badge>
              <span className="text-sm font-medium text-muted-foreground">
                {currentRound ? `${currentRound.AllRound.toLocaleString()}회` : '---'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-muted-foreground">다음 추첨</span>
              <span className="font-mono text-base font-bold text-primary">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
            </div>
          </div>

          {pl ? (
            <div className="flex flex-col items-center gap-4">
              <div className="grid w-full max-w-sm grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4">
                  <span className="text-xs text-muted-foreground">출발</span>
                  <span className={cn(
                    'text-2xl font-bold',
                    pl.leftRight === 1 ? 'text-blue-400' : 'text-red-400'
                  )}>
                    {leftRightLabel(pl.leftRight)}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4">
                  <span className="text-xs text-muted-foreground">사다리</span>
                  <span className="text-2xl font-bold text-primary">
                    {ladderCountLabel(pl.ladderCount)}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card p-4">
                  <span className="text-xs text-muted-foreground">홀짝</span>
                  <span className={cn(
                    'text-2xl font-bold',
                    oddEvenColor(pl.oddEven)
                  )}>
                    {oddEvenLabel(pl.oddEven)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center gap-3 py-8">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-28 rounded-xl" />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ladder results table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">최근 결과 ({DISPLAY_ROUNDS}회차)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-muted-foreground">
                  <th className="px-3 py-2 text-left text-xs font-medium">회차</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">좌/우</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">줄수</th>
                  <th className="px-3 py-2 text-center text-xs font-medium">홀짝</th>
                </tr>
              </thead>
              <tbody>
                {rounds.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      데이터를 불러오는 중...
                    </td>
                  </tr>
                ) : (
                  rounds.slice(0, DISPLAY_ROUNDS).map((r) => {
                    const ladder = r.PowerLadder;
                    return (
                      <tr key={r.ID} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                        <td className="px-3 py-2 text-left font-mono text-xs text-muted-foreground">{r.Round}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn(
                            'inline-block rounded px-2 py-0.5 text-xs font-bold',
                            ladder.leftRight === 1 ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                          )}>
                            {leftRightLabel(ladder.leftRight)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-bold text-primary">
                          {ladderCountLabel(ladder.ladderCount)}
                        </td>
                        <td className={cn('px-3 py-2 text-center text-xs font-bold', oddEvenColor(ladder.oddEven))}>
                          {oddEvenLabel(ladder.oddEven)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">통계 ({DISPLAY_ROUNDS}회 기준)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <StatBar
              label="좌/우"
              items={[
                { name: '좌', pct: stats.leftPct, color: 'bg-blue-600' },
                { name: '우', pct: stats.rightPct, color: 'bg-red-600' },
              ]}
            />
            <StatBar
              label="3줄/4줄"
              items={[
                { name: '3줄', pct: stats.line3Pct, color: 'bg-purple-600' },
                { name: '4줄', pct: stats.line4Pct, color: 'bg-cyan-600' },
              ]}
            />
            <StatBar
              label="홀/짝"
              items={[
                { name: '홀', pct: stats.oddPct, color: 'bg-red-600' },
                { name: '짝', pct: stats.evenPct, color: 'bg-blue-600' },
              ]}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MinigamePage() {
  const {
    rounds,
    currentRound,
    selectedGame,
    isLoading,
    fetchRounds,
    fetchCurrentRound,
    setSelectedGame,
  } = useMinigameStore();

  const loadData = useCallback(() => {
    fetchCurrentRound();
    fetchRounds();
  }, [fetchCurrentRound, fetchRounds]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrentRound();
      fetchRounds();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchCurrentRound, fetchRounds]);

  useEffect(() => {
    loadData();
  }, [selectedGame]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (game: string) => {
    setSelectedGame(game);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-xl">🎱</span> EOS 파워볼
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedGame === 'powerball' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('powerball')}
              >
                파워볼
              </Button>
              <Button
                variant={selectedGame === 'ladder' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handleTabChange('ladder')}
              >
                파워사다리
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isLoading && rounds.length === 0 ? (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-5">
              <Skeleton className="mb-4 h-8 w-48" />
              <div className="flex gap-4">
                <Skeleton className="size-20 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="size-12 rounded-full" />
                    ))}
                  </div>
                  <Skeleton className="h-6 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="mb-2 h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      ) : selectedGame === 'powerball' ? (
        <PowerBallTab rounds={rounds} currentRound={currentRound} />
      ) : (
        <PowerLadderTab rounds={rounds} currentRound={currentRound} />
      )}
    </div>
  );
}
