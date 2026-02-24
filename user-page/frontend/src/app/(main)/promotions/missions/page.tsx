'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, Gamepad2, Coins, Target, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';

interface Mission {
  id: number;
  name: string;
  description: string;
  type: 'daily' | 'weekly';
  rewardType: 'point' | 'cash';
  rewardAmount: string;
  targetValue: number;
  progress: number;
  status: 'active' | 'completed' | 'claimed';
}

const MISSION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  game: Gamepad2,
  deposit: Coins,
  bet: Target,
  win: Trophy,
};

const getMissionIcon = (name: string) => {
  if (name.includes('게임') || name.includes('플레이')) return MISSION_ICONS.game;
  if (name.includes('입금') || name.includes('충전')) return MISSION_ICONS.deposit;
  if (name.includes('베팅') || name.includes('배팅')) return MISSION_ICONS.bet;
  if (name.includes('승리') || name.includes('당첨')) return MISSION_ICONS.win;
  return MISSION_ICONS.game;
};

const MissionCard = ({
  mission,
  onClaim,
  isClaiming,
}: {
  mission: Mission;
  onClaim: (id: number) => void;
  isClaiming: boolean;
}) => {
  const Icon = getMissionIcon(mission.name);
  const progressPercent = mission.targetValue > 0
    ? Math.min(100, Math.round((mission.progress / mission.targetValue) * 100))
    : 0;

  const isCompleted = mission.status === 'completed';
  const isClaimed = mission.status === 'claimed';

  return (
    <Card
      className={cn(
        'transition-all',
        isClaimed && 'opacity-60'
      )}
    >
      <CardContent className="flex flex-col gap-3 pt-4">
        {/* Top row: icon, name, progress count */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex size-10 items-center justify-center rounded-lg',
                isClaimed
                  ? 'bg-green-500/10'
                  : isCompleted
                    ? 'bg-yellow-500/10'
                    : 'bg-secondary'
              )}
            >
              <Icon
                className={cn(
                  'size-5',
                  isClaimed
                    ? 'text-green-400'
                    : isCompleted
                      ? 'text-yellow-400'
                      : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium">{mission.name}</p>
              <p className="text-xs text-muted-foreground">{mission.description}</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-medium text-muted-foreground">
            {mission.progress}/{mission.targetValue}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <Progress
            value={progressPercent}
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{progressPercent}%</span>
            <span className="font-medium">
              보상: {Number(mission.rewardAmount).toLocaleString('ko-KR')}
              {mission.rewardType === 'point' ? 'P' : '원'}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end">
          {isClaimed ? (
            <div className="flex items-center gap-1.5 text-sm text-green-400">
              <Check className="size-4" />
              <span>수령완료</span>
            </div>
          ) : isCompleted ? (
            <Button
              size="sm"
              onClick={() => onClaim(mission.id)}
              disabled={isClaiming}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              {isClaiming ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                '수령하기'
              )}
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground">진행중</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function MissionsPage() {
  const {
    missions,
    missionTab,
    isClaimingMission,
    isLoading,
    fetchMissions,
    claimMission,
    setMissionTab,
  } = useEventStore();

  const [claimError, setClaimError] = useState('');
  const [claimSuccess, setClaimSuccess] = useState('');

  useEffect(() => {
    fetchMissions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = useCallback(async (missionId: number) => {
    setClaimError('');
    setClaimSuccess('');
    try {
      await claimMission(missionId);
      setClaimSuccess('보상이 지급되었습니다!');
      setTimeout(() => setClaimSuccess(''), 3000);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : '보상 수령에 실패했습니다');
      setTimeout(() => setClaimError(''), 3000);
    }
  }, [claimMission]);

  const filteredMissions = missions.filter((m) => m.type === missionTab);

  const completedCount = filteredMissions.filter(
    (m) => m.status === 'completed' || m.status === 'claimed'
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">미션</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            미션을 완료하고 보상을 수령하세요
          </p>
        </CardContent>
      </Card>

      {/* Tab selector */}
      <div className="flex gap-2">
        <Button
          variant={missionTab === 'daily' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setMissionTab('daily')}
          className="flex-1"
        >
          일일 미션
        </Button>
        <Button
          variant={missionTab === 'weekly' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setMissionTab('weekly')}
          className="flex-1"
        >
          주간 미션
        </Button>
      </div>

      {/* Progress summary */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
        <span className="text-sm text-muted-foreground">
          {missionTab === 'daily' ? '일일' : '주간'} 미션 진행
        </span>
        <span className="text-sm font-medium">
          {completedCount} / {filteredMissions.length} 완료
        </span>
      </div>

      {/* Success/Error messages */}
      {claimSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center text-sm font-medium text-green-400">
          {claimSuccess}
        </div>
      )}
      {claimError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
          {claimError}
        </div>
      )}

      {/* Mission list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 animate-pulse rounded-lg bg-secondary" />
                  <div className="flex flex-col gap-1.5">
                    <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-48 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
                <div className="h-2 animate-pulse rounded-full bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <span className="text-3xl">🎯</span>
          <p className="text-sm text-muted-foreground">
            {missionTab === 'daily' ? '오늘의' : '이번 주'} 미션이 없습니다
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onClaim={handleClaim}
              isClaiming={isClaimingMission}
            />
          ))}
        </div>
      )}
    </div>
  );
}
