'use client';

import { useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useSportsStore } from '@/stores/sports-store';

const formatOdds = (value: number) => value.toFixed(2);

const formatTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
};

export default function SportsPage() {
  const {
    sportEvents,
    sportCategories,
    selectedStatus,
    selectedSport,
    isLoading,
    fetchSportEvents,
    fetchSportCategories,
    setSelectedStatus,
    setSelectedSport,
  } = useSportsStore();

  const loadEvents = useCallback(() => {
    fetchSportEvents();
  }, [fetchSportEvents]);

  useEffect(() => {
    fetchSportCategories();
    loadEvents();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh for live events every 30s
  useEffect(() => {
    if (selectedStatus !== 'LIVE') return;
    const interval = setInterval(() => {
      fetchSportEvents();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedStatus, fetchSportEvents]);

  // Refetch when status or sport changes
  useEffect(() => {
    fetchSportEvents();
  }, [selectedStatus, selectedSport]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>⚽</span> 스포츠
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Status tabs */}
      <div className="flex gap-2">
        <Button
          variant={selectedStatus === 'LIVE' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setSelectedStatus('LIVE')}
          className="gap-1.5"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-red-500" />
          </span>
          라이브
        </Button>
        <Button
          variant={selectedStatus === 'SCHEDULED' ? 'default' : 'secondary'}
          size="sm"
          onClick={() => setSelectedStatus('SCHEDULED')}
        >
          예정
        </Button>
      </div>

      {/* Sport category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {sportCategories.map((cat) => (
          <Button
            key={cat.code}
            variant={selectedSport === cat.code ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSport(cat.code)}
            className="shrink-0 gap-1"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
            {cat.count > 0 && (
              <Badge variant="secondary" className="ml-0.5 px-1 text-[10px]">
                {cat.count}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-24" />
                <Skeleton className="mb-2 h-8 w-full" />
                <Skeleton className="h-6 w-48" />
              </CardContent>
            </Card>
          ))
        ) : sportEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">🏟️</span>
              <p className="text-sm text-muted-foreground">
                {selectedStatus === 'LIVE'
                  ? '현재 진행 중인 경기가 없습니다'
                  : '예정된 경기가 없습니다'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sportEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden transition-colors hover:border-primary/50">
              <CardContent className="pt-4">
                {/* League and status */}
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {event.status === 'LIVE' && (
                      <span className="relative flex size-2">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex size-2 rounded-full bg-red-500" />
                      </span>
                    )}
                    <Badge variant={event.status === 'LIVE' ? 'destructive' : 'secondary'} className="text-[10px]">
                      {event.status === 'LIVE' ? 'LIVE' : '예정'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {event.sportKo} &middot; {event.league}
                    </span>
                  </div>
                  {event.status === 'LIVE' && event.minute !== undefined && (
                    <span className="text-xs font-medium text-red-400">
                      {event.period} {event.minute}&apos;
                    </span>
                  )}
                  {event.status === 'SCHEDULED' && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(event.startTime)}
                    </span>
                  )}
                </div>

                {/* Teams and score */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.homeTeam}</span>
                      {event.homeScore !== undefined && (
                        <span className={cn(
                          'text-lg font-bold',
                          event.status === 'LIVE' && 'text-primary'
                        )}>
                          {event.homeScore}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.awayTeam}</span>
                      {event.awayScore !== undefined && (
                        <span className={cn(
                          'text-lg font-bold',
                          event.status === 'LIVE' && 'text-primary'
                        )}>
                          {event.awayScore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Odds */}
                {event.odds && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex-col gap-0 py-2"
                    >
                      <span className="text-[10px] text-muted-foreground">홈</span>
                      <span className="text-xs font-bold">{formatOdds(event.odds.home)}</span>
                    </Button>
                    {event.odds.draw !== undefined && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 flex-col gap-0 py-2"
                      >
                        <span className="text-[10px] text-muted-foreground">무</span>
                        <span className="text-xs font-bold">{formatOdds(event.odds.draw)}</span>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex-col gap-0 py-2"
                    >
                      <span className="text-[10px] text-muted-foreground">원정</span>
                      <span className="text-xs font-bold">{formatOdds(event.odds.away)}</span>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
