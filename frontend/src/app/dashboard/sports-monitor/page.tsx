'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useToast } from '@/components/toast-provider';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
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
  { key: 'FINISHED', label: '종료', color: 'bg-muted-foreground text-white hover:bg-muted-foreground/80' },
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
  LIVE: { label: 'LIVE', icon: '🔴', cls: 'bg-red-500/10 text-red-500' },
  SCHEDULED: { label: '예정', icon: '📅', cls: 'bg-blue-500/10 text-blue-500' },
  FINISHED: { label: '종료', icon: '✅', cls: 'bg-muted text-foreground' },
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
    const t = setTimeout(() => setCountdown(REFRESH_INTERVAL_MS), 0);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL_MS : prev - 1));
    }, 1000);
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    }
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
      <div className="grid grid-cols-3 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f7fa] border border-[#e5e9f0] rounded-2xl shadow-[inset_0_-4px_0_rgba(200,205,215,0.4),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_10px_rgba(0,0,0,0.05)]">
          <div className="py-5 px-6 flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_8px_rgba(239,68,68,0.3)]">
              <Activity className="h-7 w-7 text-white drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-slate-500 mb-0.5 tracking-tight">현재 이벤트</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f7fa] border border-[#e5e9f0] rounded-2xl shadow-[inset_0_-4px_0_rgba(200,205,215,0.4),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_10px_rgba(0,0,0,0.05)]">
          <div className="py-5 px-6 flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_8px_rgba(16,185,129,0.3)]">
              <Trophy className="h-7 w-7 text-white drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-slate-500 mb-0.5 tracking-tight">라이브 중</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">{statusFilter === 'LIVE' ? events.length : liveCount}</p>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f7fa] border border-[#e5e9f0] rounded-2xl shadow-[inset_0_-4px_0_rgba(200,205,215,0.4),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_10px_rgba(0,0,0,0.05)]">
          <div className="py-5 px-6 flex items-center gap-5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_8px_rgba(59,130,246,0.3)]">
              <TrendingUp className="h-7 w-7 text-white drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[13px] font-extrabold text-slate-500 mb-0.5 tracking-tight">종목 수</p>
              <p className="text-3xl font-black text-slate-800 tracking-tighter drop-shadow-sm">
                {new Set(events.map((e) => e.sport)).size}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 bg-white p-5 rounded-2xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),_0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e9f0]">
        {/* Status Filter */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-extrabold text-slate-500 min-w-[50px]">상태</span>
          <div className="flex gap-2">
            {STATUS_FILTERS.map((filter) => {
              const isActive = statusFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => { setStatusFilter(filter.key); setSportFilter(''); }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-sm font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden",
                    isActive 
                      ? 'bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white border-none shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.5),_0_4px_8px_rgba(30,106,219,0.4)]' 
                      : 'bg-gradient-to-b from-white to-[#f0f4f8] text-slate-500 border border-[#d1d7e0] shadow-[inset_0_-3px_0_rgba(200,206,214,0.4),_0_3px_5px_rgba(0,0,0,0.06)] hover:shadow-[inset_0_-3px_0_rgba(200,206,214,0.4),_0_5px_8px_rgba(0,0,0,0.08)]'
                  )}
                >
                  <span className="relative z-10 drop-shadow-sm flex items-center gap-1.5">
                    {filter.key === 'LIVE' && <span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)] animate-pulse" />}
                    {filter.key === 'SCHEDULED' && '📅'}
                    {filter.key === 'FINISHED' && '✅'}
                    {filter.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sport Filter */}
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-extrabold text-slate-500 min-w-[50px]">종목</span>
          <div className="flex gap-2 flex-wrap">
            {SPORT_FILTERS.map((filter) => {
              const isActive = sportFilter === filter.key;
              return (
                <button
                  key={filter.key}
                  onClick={() => setSportFilter(filter.key)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[13px] font-bold transition-all transform hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden",
                    isActive 
                      ? 'bg-gradient-to-b from-slate-600 to-slate-800 text-white border-none shadow-[inset_0_-3px_0_rgba(0,0,0,0.4),_inset_0_2px_4px_rgba(255,255,255,0.2),_0_4px_8px_rgba(0,0,0,0.3)]' 
                      : 'bg-gradient-to-b from-white to-[#f0f4f8] text-slate-500 border border-[#d1d7e0] shadow-[inset_0_-2px_0_rgba(200,206,214,0.4),_0_2px_4px_rgba(0,0,0,0.05)] hover:shadow-[inset_0_-2px_0_rgba(200,206,214,0.4),_0_4px_6px_rgba(0,0,0,0.08)]'
                  )}
                >
                  <span className="relative z-10 drop-shadow-sm flex items-center gap-1.5">
                    {filter.label}
                  </span>
                </button>
              );
            })}
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
    <div
      className="cursor-pointer relative overflow-hidden border border-white/60 bg-gradient-to-b from-white to-[#f0f4f8] shadow-[inset_0_-4px_0_rgba(200,206,214,0.5),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_12px_rgba(0,0,0,0.06)] rounded-2xl transition-all transform hover:-translate-y-1 hover:shadow-[inset_0_-4px_0_rgba(200,206,214,0.5),_inset_0_4px_6px_rgba(255,255,255,1),_0_8px_16px_rgba(0,0,0,0.1)] mb-4"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 bottom-0 w-2.5 z-10 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]" style={{ background: isLive ? 'linear-gradient(to bottom, #f87171, #dc2626)' : event.status === 'SCHEDULED' ? 'linear-gradient(to bottom, #60a5fa, #2563eb)' : 'linear-gradient(to bottom, #9ca3af, #6b7280)' }} />
      
      <div className="py-4 px-6 pl-8">
        {/* Top Row: Status + Tournament + Time */}
        <div className="flex items-center justify-between mb-4 border-b border-[#e5e9f0] pb-3">
          <div className="flex items-center gap-2.5">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-black shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] text-white tracking-widest", isLive ? "bg-red-500" : event.status === "SCHEDULED" ? "bg-blue-500" : "bg-slate-500")}>
              {statusStyle.label}
            </span>
            <span className="text-xs text-slate-500 font-extrabold">{sportLabel}</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-bold">{event.tournament}</span>
          </div>
          <div className="flex items-center gap-2">
            {isLive && event.time_info && (
              <span className="text-[11px] px-2 py-0.5 font-bold rounded-lg text-red-500 bg-red-50 border border-red-100 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]">
                {event.time_info}
              </span>
            )}
            {!isLive && event.start_time && (
              <span className="text-[11px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-lg border border-[#e5e9f0] shadow-sm">
                {formatEventTime(event.start_time)}
              </span>
            )}
          </div>
        </div>

        {/* Middle Row: Teams + Score */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 text-right flex justify-end">
            <span className={cn("text-[16px] font-black tracking-tight", isLive ? 'text-slate-800' : 'text-slate-600')}>
              {event.home_team}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center min-w-[120px]">
            {hasScore ? (
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900 text-white rounded-xl shadow-[inset_0_-3px_0_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.2),_0_4px_6px_rgba(0,0,0,0.2)] px-4 py-2 border border-slate-700 w-full relative overflow-hidden">
                <div className="absolute inset-x-0 top-0 h-1/2 bg-white/5" />
                <div className="flex items-center gap-3 relative z-10">
                  <span className="text-[26px] font-black tabular-nums tracking-tighter drop-shadow-md">{event.home_score}</span>
                  <span className="text-white/40 text-sm font-black -mt-1">:</span>
                  <span className="text-[26px] font-black tabular-nums tracking-tighter drop-shadow-md">{event.away_score}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center bg-white text-slate-400 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02),_0_2px_4px_rgba(0,0,0,0.05)] px-4 py-1.5 border border-[#e5e9f0] w-full text-[13px] font-black tracking-widest">
                VS
              </div>
            )}
            {isLive && event.period && (
              <span className="text-[11px] font-black text-red-500 mt-2 bg-red-50 px-2 py-0.5 rounded border border-red-100">{event.period}</span>
            )}
          </div>
          
          <div className="flex-1 text-left flex justify-start">
            <span className={cn("text-[16px] font-black tracking-tight", isLive ? 'text-slate-800' : 'text-slate-600')}>
              {event.away_team}
            </span>
          </div>
        </div>

        {/* Bottom Row: Odds */}
        {event.odds_1x2 && (
          <div className="flex items-center justify-center gap-0 w-full max-w-[500px] mx-auto mt-4 p-1.5 bg-slate-200/40 rounded-[18px] shadow-inner border border-slate-200/60">
            <OddsBadge label="홈" value={event.odds_1x2.home} />
            <div className="w-[1px] h-8 bg-slate-300 mx-1"></div>
            <OddsBadge label="무" value={event.odds_1x2.draw} />
            <div className="w-[1px] h-8 bg-slate-300 mx-1"></div>
            <OddsBadge label="원정" value={event.odds_1x2.away} />
          </div>
        )}
      </div>
    </div>
  );
}

function OddsBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-white to-[#f0f4f8] border border-[#d1d7e0] px-2 py-2 shadow-[inset_0_-3px_0_rgba(200,206,214,0.6),_inset_0_2px_4px_rgba(255,255,255,1),_0_2px_4px_rgba(0,0,0,0.05)] hover:to-[#e4e9f0] transition-colors relative overflow-hidden">
      <span className="text-[10px] text-slate-500 font-black tracking-tight mb-0.5 z-10 relative">{label}</span>
      <span className="text-[15px] font-black tabular-nums text-slate-800 z-10 relative">{value.toFixed(2)}</span>
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
      <div className="relative overflow-hidden bg-gradient-to-b from-white to-[#f4f7fa] border border-[#e5e9f0] rounded-2xl shadow-[inset_0_-4px_0_rgba(200,205,215,0.4),_inset_0_4px_6px_rgba(255,255,255,1),_0_6px_10px_rgba(0,0,0,0.05)]">
        <div className="py-4 px-5">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-black shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)] text-white tracking-widest", event.status === 'LIVE' ? "bg-red-500" : event.status === "SCHEDULED" ? "bg-blue-500" : "bg-slate-500")}>
              {statusStyle.label}
            </span>
            <span className="text-xs text-slate-500 font-extrabold">{sportLabel}</span>
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-bold">{event.tournament}</span>
          </div>
          
          <div className="flex items-center justify-between gap-3 py-2">
            <span className="text-[16px] font-black text-right flex-1 tracking-tight text-slate-800">{event.home_team}</span>
            
            <div className="flex flex-col items-center min-w-[100px]">
              {hasScore ? (
                <div className="flex items-center justify-center gap-2 bg-gradient-to-b from-slate-800 to-slate-900 text-white rounded-xl shadow-[inset_0_-3px_0_rgba(0,0,0,0.5),_0_4px_6px_rgba(0,0,0,0.2)] px-4 py-1.5 border border-slate-700 w-full">
                  <span className="text-[20px] font-black tabular-nums">{event.home_score}</span>
                  <span className="text-white/40 text-sm font-black -mt-1">:</span>
                  <span className="text-[20px] font-black tabular-nums">{event.away_score}</span>
                </div>
              ) : (
                <div className="flex items-center justify-center bg-white text-slate-400 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] px-4 py-1 border border-[#e5e9f0] w-full text-[13px] font-black">
                  VS
                </div>
              )}
            </div>

            <span className="text-[16px] font-black text-left flex-1 tracking-tight text-slate-800">{event.away_team}</span>
          </div>
          {event.status === 'LIVE' && event.time_info && (
            <p className="text-center text-[11px] text-red-500 font-black mt-3 bg-red-50 py-1 rounded-lg border border-red-100">{event.time_info} {event.period}</p>
          )}
        </div>
      </div>

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
    <div className="relative bg-gradient-to-b from-white to-[#f8fafc] border border-[#e5e9f0] rounded-xl shadow-[inset_0_-3px_0_rgba(200,205,215,0.3),_inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_6px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="py-3 px-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
          <span className="text-[13px] font-black text-slate-700">{bookmaker.bookmaker_ko}</span>
          <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold border border-slate-200">{bookmaker.bookmaker}</span>
        </div>
        <div className="space-y-3">
          {bookmaker.markets.map((market) => (
            <div key={market.type} className="space-y-1.5">
              <p className="text-[11px] text-slate-500 font-black tracking-tight pl-1">
                {MARKET_TYPE_KO[market.type] || market.type_ko || market.type}
              </p>
              <div className="flex gap-2 flex-wrap">
                {market.outcomes.map((outcome) => (
                  <div
                    key={outcome.name}
                    className="flex flex-1 min-w-[80px] flex-col items-center justify-center rounded-xl bg-gradient-to-b from-white to-[#f0f4f8] border border-[#d1d7e0] px-2 py-1.5 shadow-[inset_0_-2px_0_rgba(200,206,214,0.5),_0_2px_3px_rgba(0,0,0,0.03)]"
                  >
                    <span className="text-[10px] text-slate-500 font-bold mb-0.5">{outcome.name}</span>
                    <span className="text-[14px] font-black tabular-nums text-slate-800">{outcome.odds.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
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
