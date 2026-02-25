'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSportsStore } from '@/stores/sports-store';

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export default function EsportsPage() {
  const {
    esportsEvents,
    esportsCategories,
    selectedEsportGame,
    isLoading,
    fetchEsportsEvents,
    fetchEsportsCategories,
    setSelectedEsportGame,
  } = useSportsStore();

  useEffect(() => {
    fetchEsportsCategories();
    fetchEsportsEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEsportsEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEsportsEvents]);

  // Refetch when game filter changes
  useEffect(() => {
    fetchEsportsEvents(selectedEsportGame);
  }, [selectedEsportGame]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-white rounded-lg px-5 py-4">
        <h2 className="text-lg font-bold text-[#252531] flex items-center gap-2">
          <span>🎮</span> e스포츠
        </h2>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setSelectedEsportGame('all')}
          className={cn(
            'shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors',
            selectedEsportGame === 'all'
              ? 'bg-[#f4b53e] text-white'
              : 'border border-[#dddddd] text-[#707070] hover:bg-[#f8f9fc]'
          )}
        >
          전체
        </button>
        {esportsCategories.map((cat) => (
          <button
            key={cat.code}
            onClick={() => setSelectedEsportGame(cat.code)}
            className={cn(
              'shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1',
              selectedEsportGame === cat.code
                ? 'bg-[#f4b53e] text-white'
                : 'border border-[#dddddd] text-[#707070] hover:bg-[#f8f9fc]'
            )}
          >
            <span>{cat.icon}</span>
            <span>{cat.nameKo}</span>
          </button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-[#dddddd] p-4">
              <div className="mb-2 h-5 w-32 rounded bg-[#edeef3] animate-pulse" />
              <div className="mb-2 h-8 w-full rounded bg-[#edeef3] animate-pulse" />
              <div className="h-6 w-48 rounded bg-[#edeef3] animate-pulse" />
            </div>
          ))
        ) : esportsEvents.length === 0 ? (
          <div className="bg-white rounded-lg border border-[#dddddd] flex flex-col items-center gap-2 py-12">
            <span className="text-4xl">🎮</span>
            <p className="text-sm text-[#707070]">
              현재 진행 중이거나 예정된 e스포츠 경기가 없습니다
            </p>
          </div>
        ) : (
          esportsEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg border border-[#dddddd] p-4 hover:border-[#f4b53e] transition-colors"
            >
              {/* Game, tournament, and status */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {event.status === 'LIVE' && (
                    <span className="relative flex size-2">
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                    </span>
                  )}
                  {event.status === 'LIVE' ? (
                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                      LIVE
                    </span>
                  ) : (
                    <span className="bg-[#edeef3] text-[#707070] text-[10px] px-2 py-0.5 rounded-full">
                      예정
                    </span>
                  )}
                  <span className="text-xs text-[#707070]">
                    {event.leagueKo}
                  </span>
                </div>
                {event.period && (
                  <span className="border border-[#dddddd] text-[#707070] text-[10px] px-2 py-0.5 rounded-full">
                    {event.period}
                  </span>
                )}
              </div>

              {/* Teams and score */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.homeTeam.logo && (
                        <img src={event.homeTeam.logo} alt="" className="size-5 object-contain" />
                      )}
                      <span className="text-sm font-medium text-[#252531]">{event.homeTeam.nameKo}</span>
                    </div>
                    {event.homeTeam.score !== undefined && (
                      <span className={cn(
                        'text-lg font-bold',
                        event.status === 'LIVE' ? 'text-[#f4b53e]' : 'text-[#252531]'
                      )}>
                        {event.homeTeam.score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {event.awayTeam.logo && (
                        <img src={event.awayTeam.logo} alt="" className="size-5 object-contain" />
                      )}
                      <span className="text-sm font-medium text-[#252531]">{event.awayTeam.nameKo}</span>
                    </div>
                    {event.awayTeam.score !== undefined && (
                      <span className={cn(
                        'text-lg font-bold',
                        event.status === 'LIVE' ? 'text-[#f4b53e]' : 'text-[#252531]'
                      )}>
                        {event.awayTeam.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Elapsed info for live */}
              {event.status === 'LIVE' && event.elapsed && (
                <p className="mb-3 text-xs text-[#707070]">
                  {event.elapsed}
                </p>
              )}

              {/* Start time for scheduled */}
              {event.status === 'SCHEDULED' && (
                <p className="mb-3 text-xs text-[#707070]">
                  시작 시간: {formatTime(event.startTime)}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
