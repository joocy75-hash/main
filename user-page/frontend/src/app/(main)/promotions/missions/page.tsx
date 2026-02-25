'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, Gamepad2, Coins, Target, Trophy } from 'lucide-react';
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
    <div
      className={cn(
        'rounded-lg bg-white p-4 shadow-sm',
        isClaimed && 'opacity-60'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex size-10 items-center justify-center rounded-lg',
              isClaimed
                ? 'bg-green-50'
                : isCompleted
                  ? 'bg-amber-50'
                  : 'bg-gray-100'
            )}
          >
            <Icon
              className={cn(
                'size-5',
                isClaimed
                  ? 'text-green-500'
                  : isCompleted
                    ? 'text-[#f4b53e]'
                    : 'text-gray-400'
              )}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#252531]">{mission.name}</p>
            <p className="text-xs text-[#707070]">{mission.description}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-medium text-[#707070]">
          {mission.progress}/{mission.targetValue}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#f4b53e] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#707070]">{progressPercent}%</span>
          <span className="font-semibold text-[#252531]">
            보상: {Number(mission.rewardAmount).toLocaleString('ko-KR')}
            {mission.rewardType === 'point' ? 'P' : '원'}
          </span>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        {isClaimed ? (
          <div className="flex items-center gap-1.5 text-sm text-green-500">
            <Check className="size-4" />
            <span>수령완료</span>
          </div>
        ) : isCompleted ? (
          <button
            onClick={() => onClaim(mission.id)}
            disabled={isClaiming}
            className="rounded-full bg-gradient-to-b from-[#ffd651] to-[#fe960e] px-5 py-1.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isClaiming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              '수령하기'
            )}
          </button>
        ) : (
          <span className="text-sm text-[#999]">진행중</span>
        )}
      </div>
    </div>
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
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-lg font-bold text-[#252531]">퀘스트</h1>
        <p className="mt-1 text-sm text-[#707070]">
          미션을 완료하고 보상을 수령하세요
        </p>
      </div>

      {/* Tab selector - kzkzb pill style */}
      <div className="flex gap-2 rounded-lg bg-white p-2 shadow-sm">
        <button
          onClick={() => setMissionTab('daily')}
          className={cn(
            'flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition-all',
            missionTab === 'daily'
              ? 'bg-[#f4b53e] text-white shadow-sm'
              : 'text-[#707070] hover:bg-gray-50'
          )}
        >
          일일 미션
        </button>
        <button
          onClick={() => setMissionTab('weekly')}
          className={cn(
            'flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition-all',
            missionTab === 'weekly'
              ? 'bg-[#f4b53e] text-white shadow-sm'
              : 'text-[#707070] hover:bg-gray-50'
          )}
        >
          주간 미션
        </button>
      </div>

      {/* Progress summary */}
      <div className="flex items-center justify-between rounded-lg bg-white px-5 py-3 shadow-sm">
        <span className="text-sm text-[#707070]">
          {missionTab === 'daily' ? '일일' : '주간'} 미션 진행
        </span>
        <span className="text-sm font-bold text-[#252531]">
          {completedCount} / {filteredMissions.length} 완료
        </span>
      </div>

      {/* Success/Error messages */}
      {claimSuccess && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-600">
          {claimSuccess}
        </div>
      )}
      {claimError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
          {claimError}
        </div>
      )}

      {/* Mission list */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="size-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="flex flex-col gap-1.5">
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-48 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
              <div className="mt-3 h-2 animate-pulse rounded-full bg-gray-100" />
            </div>
          ))}
        </div>
      ) : filteredMissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg bg-white py-12 text-center shadow-sm">
          <span className="text-3xl">🎯</span>
          <p className="text-sm text-[#707070]">
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
