'use client';

import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────

export type QuotaStatus = {
  api_name: string;
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
};

export type SyncResult = {
  new_count: number;
  updated_count: number;
  total_count: number;
};

export type GameLaunchResult = {
  url: string;
  expires_in: number;
};

export type SportEvent = {
  id: number;
  sport: string;
  sport_ko: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  status_ko: string;
  start_time: string;
  odds_home: number | null;
  odds_draw: number | null;
  odds_away: number | null;
  league: string | null;
};

export type EsportEvent = {
  id: number;
  category: string;
  category_ko: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  best_of: number | null;
  status: string;
  tournament: string | null;
  start_time: string;
};

export type GameLaunchBody = {
  user_id: number;
  game_id: string;
  platform: number;
  currency: string;
  home_url: string;
};

export type OddsData = {
  event_id: number;
  bookmakers: Array<{
    name: string;
    markets: Array<{
      type: string;
      outcomes: Array<{ name: string; odds: number }>;
    }>;
  }>;
};

// ─── Hook ────────────────────────────────────────────────────────

export function useExternalApi() {
  const [quotas, setQuotas] = useState<QuotaStatus[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const loading = Object.values(loadingMap).some(Boolean);
  const setOpLoading = (key: string, val: boolean) => setLoadingMap((prev) => ({ ...prev, [key]: val }));
  const [error, setError] = useState<string | null>(null);

  const fetchQuotas = useCallback(async () => {
    setOpLoading('fetchQuotas', true);
    setError(null);
    try {
      const result = await apiClient.get<QuotaStatus[]>('/api/v1/external-api/quotas');
      setQuotas(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quotas');
    } finally {
      setOpLoading('fetchQuotas', false);
    }
  }, []);

  const resetQuota = useCallback(async (apiName: string) => {
    setOpLoading('resetQuota', true);
    try {
      await apiClient.post(`/api/v1/external-api/quotas/reset/${apiName}`);
      await fetchQuotas();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to reset quota');
    } finally {
      setOpLoading('resetQuota', false);
    }
  }, [fetchQuotas]);

  const syncProviders = useCallback(async (): Promise<SyncResult> => {
    setOpLoading('syncProviders', true);
    try {
      const result = await apiClient.post<SyncResult>('/api/v1/external-api/casino/sync-providers');
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to sync providers');
    } finally {
      setOpLoading('syncProviders', false);
    }
  }, []);

  const syncGames = useCallback(async (providerCode: string): Promise<SyncResult> => {
    setOpLoading('syncGames', true);
    try {
      const result = await apiClient.post<SyncResult>(
        `/api/v1/external-api/casino/sync-games/${providerCode}`
      );
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to sync games');
    } finally {
      setOpLoading('syncGames', false);
    }
  }, []);

  const syncAllGames = useCallback(async (): Promise<SyncResult> => {
    setOpLoading('syncAllGames', true);
    try {
      const result = await apiClient.post<SyncResult>('/api/v1/external-api/casino/sync-all-games');
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to sync all games');
    } finally {
      setOpLoading('syncAllGames', false);
    }
  }, []);

  const launchGame = useCallback(async (body: GameLaunchBody): Promise<GameLaunchResult> => {
    setOpLoading('launchGame', true);
    try {
      const result = await apiClient.post<GameLaunchResult>(
        '/api/v1/external-api/casino/launch',
        body
      );
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to launch game');
    } finally {
      setOpLoading('launchGame', false);
    }
  }, []);

  const getSportsEvents = useCallback(async (status: string): Promise<SportEvent[]> => {
    setOpLoading('getSportsEvents', true);
    try {
      const result = await apiClient.get<SportEvent[]>(
        `/api/v1/external-api/sports/events?status=${status}`
      );
      return Array.isArray(result) ? result : [];
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch sports events');
    } finally {
      setOpLoading('getSportsEvents', false);
    }
  }, []);

  const getSportsOdds = useCallback(async (eventId: number): Promise<OddsData> => {
    setOpLoading('getSportsOdds', true);
    try {
      const result = await apiClient.get<OddsData>(
        `/api/v1/external-api/sports/odds/${eventId}`
      );
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch odds');
    } finally {
      setOpLoading('getSportsOdds', false);
    }
  }, []);

  const getSportLive = useCallback(async (sport: string): Promise<SportEvent[]> => {
    setOpLoading('getSportLive', true);
    try {
      const result = await apiClient.get<SportEvent[]>(
        `/api/v1/external-api/sports/live/${sport}`
      );
      return Array.isArray(result) ? result : [];
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch live sport data');
    } finally {
      setOpLoading('getSportLive', false);
    }
  }, []);

  const getEsportsLive = useCallback(async (): Promise<EsportEvent[]> => {
    setOpLoading('getEsportsLive', true);
    try {
      const result = await apiClient.get<EsportEvent[]>('/api/v1/external-api/esports/live');
      return Array.isArray(result) ? result : [];
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to fetch esports data');
    } finally {
      setOpLoading('getEsportsLive', false);
    }
  }, []);

  return {
    quotas,
    loading,
    error,
    fetchQuotas,
    resetQuota,
    syncProviders,
    syncGames,
    syncAllGames,
    launchGame,
    getSportsEvents,
    getSportsOdds,
    getSportLive,
    getEsportsLive,
  };
}
