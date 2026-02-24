'use client';

import { useEffect } from 'react';
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🎮</span> e스포츠
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        <Button
          variant={selectedEsportGame === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedEsportGame('all')}
          className="shrink-0"
        >
          전체
        </Button>
        {esportsCategories.map((cat) => (
          <Button
            key={cat.code}
            variant={selectedEsportGame === cat.code ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedEsportGame(cat.code)}
            className="shrink-0 gap-1"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </Button>
        ))}
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <Skeleton className="mb-2 h-5 w-32" />
                <Skeleton className="mb-2 h-8 w-full" />
                <Skeleton className="h-6 w-48" />
              </CardContent>
            </Card>
          ))
        ) : esportsEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">🎮</span>
              <p className="text-sm text-muted-foreground">
                현재 진행 중이거나 예정된 e스포츠 경기가 없습니다
              </p>
            </CardContent>
          </Card>
        ) : (
          esportsEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden transition-colors hover:border-primary/50">
              <CardContent className="pt-4">
                {/* Game, tournament, and status */}
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
                      {event.gameIcon} {event.game.toUpperCase()} &middot; {event.tournament}
                    </span>
                  </div>
                  {event.bestOf && (
                    <Badge variant="outline" className="text-[10px]">
                      Bo{event.bestOf}
                    </Badge>
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

                {/* Map scores */}
                {event.mapScores && event.mapScores.length > 0 && (
                  <div className="mb-3 flex gap-2">
                    {event.mapScores.map((map, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col items-center rounded-md border border-border px-3 py-1"
                      >
                        <span className="text-[10px] text-muted-foreground">
                          {event.game === 'lol' || event.game === 'dota2' ? `게임 ${idx + 1}` : `맵 ${idx + 1}`}
                        </span>
                        <span className="text-xs font-bold">
                          {map.home} - {map.away}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Start time for scheduled */}
                {event.status === 'SCHEDULED' && (
                  <p className="mb-3 text-xs text-muted-foreground">
                    시작 시간: {formatTime(event.startTime)}
                  </p>
                )}

                {/* Odds */}
                {event.odds && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex-col gap-0 py-2"
                    >
                      <span className="max-w-full truncate text-[10px] text-muted-foreground">{event.homeTeam}</span>
                      <span className="text-xs font-bold">{formatOdds(event.odds.home)}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 flex-col gap-0 py-2"
                    >
                      <span className="max-w-full truncate text-[10px] text-muted-foreground">{event.awayTeam}</span>
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
