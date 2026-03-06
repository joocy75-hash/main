'use client';

import { useEffect, useState, useCallback, createElement } from 'react';
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
        'rounded-2xl bg-white border border-[#e2e8f0] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden',
        isClaimed && 'opacity-60 grayscale-[0.3]'
      )}
    >
      {/* Background Decor */}
      {isCompleted && !isClaimed && (
        <div className="absolute -right-10 -top-10 size-32 rounded-full bg-emerald-100/50 blur-3xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex size-12 items-center justify-center rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,1)] border',
              isClaimed
                ? 'bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] border-[#bbf7d0]'
                : isCompleted
                  ? 'bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] border-[#a7f3d0]'
                  : 'bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border-[#e2e8f0]'
            )}
          >
            {createElement(Icon, {
              className: cn(
                'size-6 drop-shadow-sm',
                isClaimed
                  ? 'text-[#22c55e]'
                  : isCompleted
                    ? 'text-[#10b981]'
                    : 'text-[#94a3b8]'
              )
            })}
          </div>
          <div className="space-y-0.5">
            <p className="text-[15px] font-black text-[#1e293b]">{mission.name}</p>
            <p className="text-[12px] font-bold text-[#64748b]">{mission.description}</p>
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end">
          <span className="text-[13px] font-black text-[#64748b] bg-[#f1f5f9] px-2.5 py-1 rounded-lg border border-[#e2e8f0]">
            <span className={cn('mr-0.5', isCompleted ? 'text-[#10b981]' : 'text-[#f59e0b]')}>{mission.progress}</span>
            <span className="text-[#94a3b8]">/ {mission.targetValue}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5 relative z-10">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#f1f5f9] shadow-inner border border-[#e2e8f0]">
          <div
            className={cn(
              "h-full rounded-full shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)] transition-all duration-1000 ease-out",
              isCompleted 
                ? "bg-gradient-to-r from-[#34d399] to-[#10b981]" 
                : "bg-gradient-to-r from-[#ffd651] to-[#f59e0b]"
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-[12px] font-extrabold text-[#64748b]">{progressPercent}% 완료</span>
          <span className="text-[13px] font-black text-[#1e293b] flex items-center gap-1">
            <span className="text-[14px]">🎁</span> 보상: <span className="text-[#f59e0b] drop-shadow-sm">{Number(mission.rewardAmount).toLocaleString('ko-KR')}</span>
            <span className="text-[#64748b]">{mission.rewardType === 'point' ? 'P' : '원'}</span>
          </span>
        </div>
      </div>

      <div className="mt-4 flex justify-end relative z-10">
        {isClaimed ? (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] px-4 py-2 text-[13px] font-black text-[#22c55e] shadow-sm">
            <Check className="size-4 stroke-[3]" />
            <span>수령완료</span>
          </div>
        ) : isCompleted ? (
          <button
            onClick={() => onClaim(mission.id)}
            disabled={isClaiming}
            className="rounded-xl bg-gradient-to-b from-[#10b981] to-[#059669] px-8 py-2.5 text-[14px] font-black text-white shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_0_4px_6px_rgba(16,185,129,0.3)] transition-all hover:translate-y-[1px] hover:shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none min-w-[120px]"
          >
            {isClaiming ? (
              <Loader2 className="size-5 animate-spin mx-auto" />
            ) : (
              '보상 수령하기'
            )}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] px-4 py-2 text-[13px] font-black text-[#94a3b8] shadow-sm">
            <Loader2 className="size-3.5 animate-spin text-[#cbd5e1]" />
            <span>진행중</span>
          </div>
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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h1 className="text-lg font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
            <span className="text-xl">🏆</span> 퀘스트
          </h1>
          <p className="mt-1 text-[13px] font-bold text-[#64748b]">
            보유하신 미션을 완료하고 특별한 보상을 수령하세요.
          </p>
        </div>

        {/* Action Bar (Tabs & Summary) */}
        <div className="p-4 bg-[#fbfcfd] flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Tab selector - 3D pill style */}
          <div className="flex gap-2 rounded-xl bg-[#f1f5f9] p-1.5 border border-[#e2e8f0] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] w-full md:w-auto">
            <button
              onClick={() => setMissionTab('daily')}
              className={cn(
                'flex-1 min-w-[120px] rounded-lg px-4 py-2 text-[14px] font-black transition-all duration-300',
                missionTab === 'daily'
                  ? 'bg-gradient-to-b from-[#10b981] to-[#059669] text-white shadow-[0_2px_4px_rgba(16,185,129,0.3),_inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-[#64748b] hover:bg-white hover:shadow-sm'
              )}
            >
              일일 미션
            </button>
            <button
              onClick={() => setMissionTab('weekly')}
              className={cn(
                'flex-1 min-w-[120px] rounded-lg px-4 py-2 text-[14px] font-black transition-all duration-300',
                missionTab === 'weekly'
                  ? 'bg-gradient-to-b from-[#10b981] to-[#059669] text-white shadow-[0_2px_4px_rgba(16,185,129,0.3),_inset_0_1px_1px_rgba(255,255,255,0.3)]'
                  : 'text-[#64748b] hover:bg-white hover:shadow-sm'
              )}
            >
              주간 미션
            </button>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-4 rounded-xl bg-white border border-[#e2e8f0] px-5 py-2.5 shadow-sm w-full md:w-auto">
            <span className="text-[13px] font-extrabold text-[#64748b]">
              <span className="text-[#10b981] mr-1">●</span>
              {missionTab === 'daily' ? '일일' : '주간'} 진행도
            </span>
            <div className="w-px h-4 bg-[#e2e8f0]"></div>
            <span className="text-[14px] font-black text-[#1e293b]">
              <span className="text-[#10b981] drop-shadow-sm mr-0.5">{completedCount}</span> / {filteredMissions.length}
            </span>
          </div>
        </div>
      </div>

      {/* Success/Error messages */}
      {claimSuccess && (
        <div className="rounded-xl border border-green-200 bg-gradient-to-b from-green-50 to-green-50/50 p-4 text-center text-[13px] font-extrabold text-green-700 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          {claimSuccess}
        </div>
      )}
      {claimError && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-red-50/50 p-4 text-center text-[13px] font-extrabold text-red-600 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
          {claimError}
        </div>
      )}

      {/* Mission list */}
      <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] p-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="size-12 animate-pulse rounded-xl bg-[#f1f5f9]" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-4 w-32 animate-pulse rounded bg-[#f1f5f9]" />
                    <div className="h-3 w-48 animate-pulse rounded bg-[#f1f5f9]" />
                  </div>
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-[#f1f5f9]" />
                </div>
                <div className="mt-5 h-2.5 animate-pulse rounded-full bg-[#f1f5f9]" />
              </div>
            ))}
          </div>
        ) : filteredMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center bg-[#fbfcfd] rounded-xl border border-dashed border-[#cbd5e1]">
            <span className="text-4xl opacity-50 grayscale">🎯</span>
            <p className="text-[14px] font-extrabold text-[#94a3b8]">
              {missionTab === 'daily' ? '오늘의' : '이번 주'} 진행 가능한 미션이 없습니다
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
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
    </div>
  );
}
