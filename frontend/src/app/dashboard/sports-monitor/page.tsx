'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/components/toast-provider';
import { apiClient } from '@/lib/api-client';
import {
  Loader2,
  Inbox,
  RefreshCw,
  Timer,
  Trophy,
  X,
  TrendingUp,
  Activity,
} from 'lucide-react';
import type { SportEvent as BaseSportEvent } from '@/hooks/use-external-api';

// ─── Types ───────────────────────────────────────────────────────

type EventStatus = 'LIVE' | 'SCHEDULED' | 'FINISHED';

type SportEvent = Omit<BaseSportEvent, 'status'> & {
  status: EventStatus;
  tournament: string;
  time_info: string;
  period: string;
  odds_1x2: {
    home: number;
    draw: number;
    away: number;
  } | null;
};

type EventsResponse = {
  items: SportEvent[];
  total: number;
  cached: boolean;
};

type BookmakerOdds = {
  bookmaker: string;
  bookmaker_ko: string;
  markets: OddsMarket[];
};

type OddsMarket = {
  type: string;
  type_ko: string;
  outcomes: OddsOutcome[];
};

type OddsOutcome = {
  name: string;
  odds: number;
};

type EventOddsResponse = {
  event_id: number;
  bookmakers: BookmakerOdds[];
  cached: boolean;
};

// ─── Constants ───────────────────────────────────────────────────

const REFRESH_INTERVAL_MS = 30;

const STATUS_FILTERS: { key: EventStatus; label: string; color: string }[] = [
  { key: 'LIVE', label: '라이브', color: 'bg-red-600 text-white hover:bg-red-700' },
  { key: 'SCHEDULED', label: '예정', color: 'bg-blue-600 text-white hover:bg-blue-700' },
  { key: 'FINISHED', label: '종료', color: 'bg-gray-600 text-white hover:bg-gray-700' },
];

const SPORT_FILTERS: { key: string; label: string }[] = [
  { key: '', label: '전체' },
  { key: 'football', label: '축구' },
  { key: 'basketball', label: '농구' },
  { key: 'tennis', label: '테니스' },
  { key: 'baseball', label: '야구' },
  { key: 'ice_hockey', label: '아이스하키' },
  { key: 'esports', label: 'e스포츠' },
  { key: 'volleyball', label: '배구' },
  { key: 'mma', label: '격투기' },
  { key: 'table_tennis', label: '탁구' },
];

const SPORT_NAME_KO: Record<string, string> = {
  football: '축구',
  soccer: '축구',
  tennis: '테니스',
  basketball: '농구',
  baseball: '야구',
  ice_hockey: '아이스하키',
  esports: 'e스포츠',
  volleyball: '배구',
  mma: '격투기',
  table_tennis: '탁구',
  handball: '핸드볼',
  cricket: '크리켓',
};

const STATUS_BADGE_STYLES: Record<EventStatus, { label: string; icon: string; cls: string }> = {
  LIVE: { label: 'LIVE', icon: '🔴', cls: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' },
  SCHEDULED: { label: '예정', icon: '📅', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
  FINISHED: { label: '종료', icon: '✅', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
};

const MARKET_TYPE_KO: Record<string, string> = {
  '1X2': '1X2 (승무패)',
  'OVER_UNDER': '오버/언더',
  'BTTS': '양팀 득점',
  'DOUBLE_CHANCE': '더블 찬스',
  'HANDICAP': '핸디캡',
  'CORRECT_SCORE': '정확한 스코어',
  'HALF_TIME': '전반전 결과',
};

// ─── Hooks ───────────────────────────────────────────────────────

const useSportsEvents = (status: EventStatus, sport: string, intervalSec: number) => {
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchEvents = useCallback(async () => {
    setFetching(true);
    try {
      const sportParam = sport ? `&sport=${sport}` : '';
      const result = await apiClient.get<EventsResponse>(
        `/api/v1/external-api/sports/events?status=${status}${sportParam}`
      );
      if (mountedRef.current) {
        setEvents(result.items || []);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : '이벤트 조회 실패');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setFetching(false);
      }
    }
  }, [status, sport]);

  useEffect(() => {
    mountedRef.current = true;
    setLoading(true);
    fetchEvents();
    const interval = setInterval(fetchEvents, intervalSec * 1000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [fetchEvents, intervalSec]);

  return { events, loading, fetching, error, refetch: fetchEvents };
};

const useEventOdds = () => {
  const [odds, setOdds] = useState<EventOddsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOdds = useCallback(async (eventId: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<EventOddsResponse>(
        `/api/v1/external-api/sports/odds/${eventId}`
      );
      setOdds(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '배당률 조회 실패');
      setOdds(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setOdds(null);
    setError(null);
  }, []);

  return { odds, loading, error, fetchOdds, clear };
};

// ─── Page ────────────────────────────────────────────────────────

export default function SportsMonitorPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<EventStatus>('LIVE');
  const [sportFilter, setSportFilter] = useState('');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL_MS);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [oddsOpen, setOddsOpen] = useState(false);

  const {
    events,
    loading,
    fetching,
    error,
    refetch,
  } = useSportsEvents(statusFilter, sportFilter, REFRESH_INTERVAL_MS);

  const {
    odds,
    loading: oddsLoading,
    error: oddsError,
    fetchOdds,
    clear: clearOdds,
  } = useEventOdds();

  // Countdown timer
  useEffect(() => {
    setCountdown(REFRESH_INTERVAL_MS);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL_MS : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [statusFilter, sportFilter]);

  const handleEventClick = useCallback((event: SportEvent) => {
    setSelectedEvent(event);
    setOddsOpen(true);
    fetchOdds(event.id);
  }, [fetchOdds]);

  const handleOddsClose = useCallback((open: boolean) => {
    setOddsOpen(open);
    if (!open) {
      setSelectedEvent(null);
      clearOdds();
    }
  }, [clearOdds]);

  const handleManualRefresh = useCallback(() => {
    refetch();
    setCountdown(REFRESH_INTERVAL_MS);
    toast.info('이벤트 목록을 갱신했습니다');
  }, [refetch, toast]);

  const liveCount = events.filter((e) => e.status === 'LIVE').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">스포츠 모니터링</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            실시간 스포츠 이벤트 및 배당률 모니터링
          </p>
        </div>
        <div className="flex items-center gap-3">
          {fetching && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
          <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
            <Timer className="h-3 w-3" />
            <span className="text-xs tabular-nums">{countdown}초</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={handleManualRefresh} disabled={fetching}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${fetching ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950">
              <Activity className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">현재 이벤트</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950">
              <Trophy className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">라이브 중</p>
              <p className="text-2xl font-bold">{statusFilter === 'LIVE' ? events.length : liveCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5 flex items-center gap-4">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">종목 수</p>
              <p className="text-2xl font-bold">
                {new Set(events.map((e) => e.sport)).size}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground min-w-[60px]">상태</span>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => (
              <Button
                key={filter.key}
                size="sm"
                variant={statusFilter === filter.key ? 'default' : 'outline'}
                className={statusFilter === filter.key ? filter.color : ''}
                onClick={() => { setStatusFilter(filter.key); setSportFilter(''); }}
              >
                {filter.key === 'LIVE' && '🔴 '}
                {filter.key === 'SCHEDULED' && '📅 '}
                {filter.key === 'FINISHED' && '✅ '}
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sport Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground min-w-[60px]">종목</span>
          <div className="flex gap-1.5 flex-wrap">
            {SPORT_FILTERS.map((filter) => (
              <button
                key={filter.key}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  sportFilter === filter.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
                onClick={() => setSportFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-destructive">
            <Inbox className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">데이터를 불러오지 못했습니다</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
            <Button variant="outline" className="mt-4" onClick={refetch}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Trophy className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">
              {statusFilter === 'LIVE' ? '진행 중인 이벤트가 없습니다' :
               statusFilter === 'SCHEDULED' ? '예정된 이벤트가 없습니다' :
               '종료된 이벤트가 없습니다'}
            </p>
            <p className="text-sm mt-1">
              {sportFilter
                ? `${SPORT_NAME_KO[sportFilter] || sportFilter} 종목에 해당하는 이벤트가 없습니다.`
                : '다른 필터를 선택해보세요.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => handleEventClick(event)}
            />
          ))}
        </div>
      )}

      {/* Odds Detail Sheet */}
      <Sheet open={oddsOpen} onOpenChange={handleOddsClose}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="pb-0">
            <SheetTitle className="text-lg">상세 배당률</SheetTitle>
            <SheetDescription>
              {selectedEvent
                ? `${selectedEvent.home_team} vs ${selectedEvent.away_team}`
                : '이벤트 선택'}
            </SheetDescription>
          </SheetHeader>
          {selectedEvent && (
            <OddsDetailPanel
              event={selectedEvent}
              odds={odds}
              loading={oddsLoading}
              error={oddsError}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─── Sub Components ──────────────────────────────────────────────

function EventCard({ event, onClick }: { event: SportEvent; onClick: () => void }) {
  const statusStyle = STATUS_BADGE_STYLES[event.status];
  const sportLabel = SPORT_NAME_KO[event.sport] || event.sport;
  const hasScore = event.home_score !== null && event.away_score !== null;
  const isLive = event.status === 'LIVE';

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
      style={{
        borderLeftColor: isLive ? '#dc2626' : event.status === 'SCHEDULED' ? '#2563eb' : '#9ca3af',
      }}
      onClick={onClick}
    >
      <CardContent className="py-4 px-5">
        {/* Top Row: Status + Tournament + Time */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`text-[10px] px-1.5 ${statusStyle.cls}`}>
              {statusStyle.icon} {statusStyle.label}
            </Badge>
            <span className="text-xs text-muted-foreground font-medium">{sportLabel}</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">{event.tournament}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && event.time_info && (
              <Badge variant="outline" className="text-[10px] px-1.5 text-red-600 border-red-200 dark:border-red-800">
                {event.time_info}
              </Badge>
            )}
            {!isLive && event.start_time && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatEventTime(event.start_time)}
              </span>
            )}
          </div>
        </div>

        {/* Middle Row: Teams + Score */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div className="flex-1 text-right">
            <span className={`text-sm font-semibold ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.home_team}
            </span>
          </div>
          <div className="flex items-center gap-2 min-w-[80px] justify-center">
            {hasScore ? (
              <div className="flex items-center gap-1.5">
                <span className={`text-xl font-bold tabular-nums ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {event.home_score}
                </span>
                <span className="text-muted-foreground font-medium">:</span>
                <span className={`text-xl font-bold tabular-nums ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {event.away_score}
                </span>
              </div>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">vs</span>
            )}
          </div>
          <div className="flex-1 text-left">
            <span className={`text-sm font-semibold ${isLive ? 'text-foreground' : 'text-muted-foreground'}`}>
              {event.away_team}
            </span>
          </div>
        </div>

        {/* Bottom Row: Odds */}
        {event.odds_1x2 && (
          <div className="flex items-center justify-center gap-3">
            <OddsBadge label="홈" value={event.odds_1x2.home} />
            <OddsBadge label="무" value={event.odds_1x2.draw} />
            <OddsBadge label="원정" value={event.odds_1x2.away} />
          </div>
        )}

        {/* Period info */}
        {isLive && event.period && (
          <div className="flex justify-center mt-2">
            <span className="text-[11px] text-muted-foreground">{event.period}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OddsBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-gray-50 dark:bg-gray-800 px-3 py-1.5">
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
      <span className="text-sm font-bold tabular-nums">{value.toFixed(2)}</span>
    </div>
  );
}

function OddsDetailPanel({
  event,
  odds,
  loading,
  error,
}: {
  event: SportEvent;
  odds: EventOddsResponse | null;
  loading: boolean;
  error: string | null;
}) {
  const statusStyle = STATUS_BADGE_STYLES[event.status];
  const sportLabel = SPORT_NAME_KO[event.sport] || event.sport;
  const hasScore = event.home_score !== null && event.away_score !== null;

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Event Summary */}
      <Card>
        <CardContent className="py-3 px-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className={`text-[10px] px-1.5 ${statusStyle.cls}`}>
              {statusStyle.icon} {statusStyle.label}
            </Badge>
            <span className="text-xs text-muted-foreground">{sportLabel}</span>
            <span className="text-xs text-muted-foreground">|</span>
            <span className="text-xs text-muted-foreground">{event.tournament}</span>
          </div>
          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-sm font-semibold text-right flex-1">{event.home_team}</span>
            {hasScore ? (
              <span className="text-lg font-bold tabular-nums">
                {event.home_score} : {event.away_score}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground font-medium">vs</span>
            )}
            <span className="text-sm font-semibold text-left flex-1">{event.away_team}</span>
          </div>
          {event.status === 'LIVE' && event.time_info && (
            <p className="text-center text-xs text-red-600 font-medium">{event.time_info} {event.period}</p>
          )}
        </CardContent>
      </Card>

      {/* Bookmaker Odds */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <X className="h-8 w-8 opacity-30" />
          <p className="text-sm">배당률을 불러오지 못했습니다</p>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      ) : !odds || odds.bookmakers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Inbox className="h-8 w-8 opacity-30" />
          <p className="text-sm">배당률 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">
            북메이커별 배당률 ({odds.bookmakers.length}개)
          </h4>
          {odds.bookmakers.map((bm) => (
            <BookmakerCard key={bm.bookmaker} bookmaker={bm} />
          ))}
        </div>
      )}
    </div>
  );
}

function BookmakerCard({ bookmaker }: { bookmaker: BookmakerOdds }) {
  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{bookmaker.bookmaker_ko}</span>
          <Badge variant="outline" className="text-[10px]">{bookmaker.bookmaker}</Badge>
        </div>
        <div className="space-y-2">
          {bookmaker.markets.map((market) => (
            <div key={market.type} className="space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium">
                {MARKET_TYPE_KO[market.type] || market.type_ko || market.type}
              </p>
              <div className="flex gap-2 flex-wrap">
                {market.outcomes.map((outcome) => (
                  <div
                    key={outcome.name}
                    className="flex items-center gap-1.5 rounded-md bg-gray-50 dark:bg-gray-800 px-2.5 py-1"
                  >
                    <span className="text-[10px] text-muted-foreground">{outcome.name}</span>
                    <span className="text-xs font-bold tabular-nums">{outcome.odds.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Utilities ───────────────────────────────────────────────────

function formatEventTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
