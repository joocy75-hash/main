'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useExternalApi,
  type QuotaStatus,
  type SportEvent,
  type EsportEvent,
} from '@/hooks/use-external-api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/toast-provider';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Zap,
  Activity,
  Gamepad2,
  Trophy,
  Monitor,
  AlertCircle,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────

const AUTO_REFRESH_MS = 30_000;

const API_DISPLAY_NAMES: Record<string, string> = {
  odds_feed: 'Odds Feed',
  sport_api7: 'SportAPI7',
  casino_api: 'Casino API',
};

const API_DESCRIPTIONS: Record<string, string> = {
  odds_feed: '스포츠 배당률 (7개 북메이커)',
  sport_api7: '실시간 스포츠 (20+ 종목)',
  casino_api: '카지노/슬롯 (100+ 프로바이더)',
};

const SPORT_FILTER_OPTIONS = [
  { key: 'all', label: '전체' },
  { key: 'football', label: '축구' },
  { key: 'tennis', label: '테니스' },
  { key: 'basketball', label: '농구' },
  { key: 'baseball', label: '야구' },
  { key: 'hockey', label: '아이스하키' },
  { key: 'esports', label: 'e스포츠' },
];

const STATUS_FILTER_OPTIONS = [
  { key: 'LIVE', label: '라이브' },
  { key: 'SCHEDULED', label: '예정' },
  { key: 'FINISHED', label: '종료' },
];

const TABS = [
  { key: 'casino', label: '카지노/슬롯', icon: Gamepad2 },
  { key: 'sports', label: '스포츠 라이브', icon: Trophy },
  { key: 'esports', label: 'e스포츠', icon: Monitor },
];

// ─── Helpers ─────────────────────────────────────────────────────

const getQuotaColor = (percentage: number) => {
  if (percentage >= 100) return { bar: 'bg-red-600', text: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' };
  if (percentage >= 95) return { bar: 'bg-red-500', text: 'text-red-500', bg: '' };
  if (percentage >= 80) return { bar: 'bg-amber-500', text: 'text-amber-500', bg: '' };
  return { bar: 'bg-blue-500', text: 'text-blue-500', bg: '' };
};

const getStatusBadge = (percentage: number) => {
  if (percentage >= 100) return { label: '차단됨', className: 'bg-red-500/10 text-red-500' };
  if (percentage >= 95) return { label: '위험', className: 'bg-red-500/10 text-red-500' };
  if (percentage >= 80) return { label: '경고', className: 'bg-amber-500/10 text-amber-500' };
  return { label: '정상', className: 'bg-emerald-500/10 text-emerald-500' };
};

const fmt = (n: number) => Intl.NumberFormat('ko-KR').format(n);

// ─── Quota Card Component ────────────────────────────────────────

const QuotaCard = ({ quota }: { quota: QuotaStatus }) => {
  const colors = getQuotaColor(quota.percentage);
  const status = getStatusBadge(quota.percentage);
  const displayName = API_DISPLAY_NAMES[quota.api_name] || quota.api_name;
  const description = API_DESCRIPTIONS[quota.api_name] || '';

  return (
    <Card className={`${colors.bg} transition-colors`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{displayName}</CardTitle>
          <Badge variant="secondary" className={status.className}>
            {status.label}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {fmt(quota.used)}
            </span>
            <span className="text-sm text-muted-foreground">
              / {fmt(quota.limit)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
              style={{ width: `${Math.min(quota.percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{quota.percentage.toFixed(1)}% 사용</span>
            <span>잔여 {fmt(quota.remaining)}회</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ─── Quota Skeleton ──────────────────────────────────────────────

const QuotaCardSkeleton = () => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
      <Skeleton className="h-3 w-36 mt-1" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-2 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─── Casino Tab ──────────────────────────────────────────────────

const CasinoTab = () => {
  const toast = useToast();
  const { syncProviders, syncAllGames, loading } = useExternalApi();
  const [syncResult, setSyncResult] = useState<{
    type: string;
    new_count: number;
    updated_count: number;
    total_count: number;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  const handleSyncProviders = async () => {
    setSyncing(true);
    try {
      const result = await syncProviders();
      setSyncResult({ type: 'providers', ...result });
      toast.success(
        `프로바이더 동기화 완료: 신규 ${result.new_count}개, 갱신 ${result.updated_count}개, 전체 ${result.total_count}개`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '프로바이더 동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncAllGames = async () => {
    setSyncing(true);
    try {
      const result = await syncAllGames();
      setSyncResult({ type: 'games', ...result });
      toast.success(
        `게임 동기화 완료: 신규 ${result.new_count}개, 갱신 ${result.updated_count}개, 전체 ${result.total_count}개`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '게임 동기화 실패');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          onClick={handleSyncProviders}
          disabled={syncing || loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          프로바이더 동기화
        </Button>
        <Button
          onClick={handleSyncAllGames}
          disabled={syncing || loading}
          variant="outline"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          전체 게임 동기화
        </Button>
      </div>

      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {syncResult.type === 'providers' ? '프로바이더' : '게임'} 동기화 결과
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{fmt(syncResult.new_count)}</p>
                <p className="text-xs text-muted-foreground">신규 추가</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-400">{fmt(syncResult.updated_count)}</p>
                <p className="text-xs text-muted-foreground">갱신</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{fmt(syncResult.total_count)}</p>
                <p className="text-xs text-muted-foreground">전체</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!syncResult && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Gamepad2 className="h-16 w-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">카지노/슬롯 API 관리</p>
          <p className="text-sm mt-1">
            상단 버튼을 클릭하여 프로바이더 또는 게임을 동기화하세요.
          </p>
          <p className="text-xs mt-3 text-muted-foreground/60">
            프로바이더 동기화: 쿼터 1회 소모 (캐시 24시간) / 게임 동기화: 프로바이더당 1회 소모 (캐시 1시간)
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Sports Tab ──────────────────────────────────────────────────

const SportsTab = () => {
  const toast = useToast();
  const { getSportsEvents } = useExternalApi();
  const [events, setEvents] = useState<SportEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('LIVE');
  const [sportFilter, setSportFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const result = await getSportsEvents(statusFilter);
      setEvents(result);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '스포츠 이벤트 로드 실패');
    } finally {
      setEventsLoading(false);
    }
  }, [getSportsEvents, statusFilter, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Auto-refresh every 30 seconds for LIVE events
  useEffect(() => {
    if (statusFilter === 'LIVE') {
      intervalRef.current = setInterval(loadEvents, AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [statusFilter, loadEvents]);

  const filteredEvents = sportFilter === 'all'
    ? events
    : events.filter((e) => e.sport?.toLowerCase() === sportFilter);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === opt.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
              onClick={() => setStatusFilter(opt.key)}
            >
              {opt.key === 'LIVE' && <span className="mr-1">●</span>}
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
            className="border rounded-md px-3 py-1.5 text-sm bg-background"
          >
            {SPORT_FILTER_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              {statusFilter === 'LIVE' && <Wifi className="inline h-3 w-3 mr-1 text-emerald-500" />}
              {lastUpdated.toLocaleTimeString('ko-KR')} 갱신
              {statusFilter === 'LIVE' && ' (30초 자동)'}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadEvents}
            disabled={eventsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Events List */}
      {eventsLoading && events.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <WifiOff className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">
            {statusFilter === 'LIVE' ? '진행 중인' : statusFilter === 'SCHEDULED' ? '예정된' : '종료된'} 이벤트가 없습니다
          </p>
          <p className="text-sm mt-1">
            필터를 변경하거나 잠시 후 다시 확인해주세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex flex-col items-center shrink-0 w-16">
                  {statusFilter === 'LIVE' && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 mb-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                      LIVE
                    </span>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {event.sport_ko || event.sport}
                  </Badge>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{event.home_team}</span>
                    <span className="text-muted-foreground text-sm">vs</span>
                    <span className="font-medium truncate">{event.away_team}</span>
                  </div>
                  {event.league && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{event.league}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                {event.home_score !== null && event.away_score !== null && (
                  <div className="text-center">
                    <span className="text-xl font-bold">
                      {event.home_score} : {event.away_score}
                    </span>
                    {event.status_ko && (
                      <p className="text-xs text-muted-foreground">{event.status_ko}</p>
                    )}
                  </div>
                )}
                {(event.odds_home || event.odds_draw || event.odds_away) && (
                  <div className="flex gap-1.5">
                    {event.odds_home != null && (
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-blue-500/10 text-xs font-mono font-medium text-blue-500 min-w-[44px]">
                        {event.odds_home.toFixed(2)}
                      </span>
                    )}
                    {event.odds_draw != null && (
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-muted text-xs font-mono font-medium text-foreground min-w-[44px]">
                        {event.odds_draw.toFixed(2)}
                      </span>
                    )}
                    {event.odds_away != null && (
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded bg-orange-500/10 text-xs font-mono font-medium text-orange-500 min-w-[44px]">
                        {event.odds_away.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-right pt-2">
            총 {filteredEvents.length}개 이벤트
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Esports Tab ─────────────────────────────────────────────────

const EsportsTab = () => {
  const toast = useToast();
  const { getEsportsLive } = useExternalApi();
  const [events, setEvents] = useState<EsportEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const result = await getEsportsLive();
      setEvents(result);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'e스포츠 데이터 로드 실패');
    } finally {
      setEventsLoading(false);
    }
  }, [getEsportsLive, toast]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    intervalRef.current = setInterval(loadEvents, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadEvents]);

  // Group by category
  const grouped = events.reduce<Record<string, EsportEvent[]>>((acc, event) => {
    const key = event.category_ko || event.category || '기타';
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-medium">e스포츠 라이브</span>
          <Badge variant="secondary" className="text-xs">
            {events.length}개 진행 중
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              <Wifi className="inline h-3 w-3 mr-1 text-emerald-500" />
              {lastUpdated.toLocaleTimeString('ko-KR')} 갱신 (30초 자동)
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={loadEvents}
            disabled={eventsLoading}
          >
            <RefreshCw className={`h-4 w-4 ${eventsLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {eventsLoading && events.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Monitor className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">진행 중인 e스포츠 이벤트가 없습니다</p>
          <p className="text-sm mt-1">잠시 후 다시 확인해주세요.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, categoryEvents]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
                <span className="ml-2 text-xs font-normal">({categoryEvents.length})</span>
              </h3>
              {categoryEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                      LIVE
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{event.home_team}</span>
                        <span className="text-muted-foreground text-sm">vs</span>
                        <span className="font-medium truncate">{event.away_team}</span>
                      </div>
                      {event.tournament && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {event.tournament}
                          {event.best_of && ` (Bo${event.best_of})`}
                        </p>
                      )}
                    </div>
                  </div>
                  {event.home_score !== null && event.away_score !== null && (
                    <span className="text-xl font-bold shrink-0">
                      {event.home_score} : {event.away_score}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────

export default function ExternalApiPage() {
  const toast = useToast();
  const { quotas, loading, fetchQuotas, resetQuota } = useExternalApi();
  const [activeTab, setActiveTab] = useState('casino');
  const [resettingQuota, setResettingQuota] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotas();
  }, [fetchQuotas]);

  const handleResetQuota = async (apiName: string) => {
    setResettingQuota(apiName);
    try {
      await resetQuota(apiName);
      toast.success(`${API_DISPLAY_NAMES[apiName] || apiName} 쿼터가 리셋되었습니다`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '쿼터 리셋 실패');
    } finally {
      setResettingQuota(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">외부 API 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            RapidAPI 쿼터 현황, 카지노/슬롯 동기화, 스포츠 라이브 모니터링
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchQuotas}
          disabled={loading}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          쿼터 새로고침
        </Button>
      </div>

      {/* Quota Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading && quotas.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <QuotaCardSkeleton key={i} />)
        ) : quotas.length > 0 ? (
          quotas.map((quota) => (
            <div key={quota.api_name} className="relative group">
              <QuotaCard quota={quota} />
              <button
                onClick={() => handleResetQuota(quota.api_name)}
                disabled={resettingQuota === quota.api_name}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-accent"
                title="쿼터 리셋"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${resettingQuota === quota.api_name ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  쿼터 정보를 불러올 수 없습니다. 백엔드 API가 실행 중인지 확인해주세요.
                </p>
                <Button variant="outline" size="sm" className="mt-3" onClick={fetchQuotas}>
                  다시 시도
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Cost Info Banner */}
      <div className="rounded-lg border border-blue-500/30 bg-blue-500/10/50 p-3 flex items-center gap-3">
        <Zap className="h-4 w-4 text-blue-500 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">비용 정보</span>: 현재 무료 플랜 운영 중.
          유저사이트 오픈 시 Odds Pro ($5/월) + SportAPI7 Pro ($15/월) 전환 권장.
          캐싱 전략으로 무료 쿼터 내 운용 가능.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'casino' && <CasinoTab />}
      {activeTab === 'sports' && <SportsTab />}
      {activeTab === 'esports' && <EsportsTab />}
    </div>
  );
}
