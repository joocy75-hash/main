'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────

export type TransactionLimit = {
  id: number;
  scope_type: string;
  scope_id: number;
  tx_type: string;
  min_amount: number;
  max_amount: number;
  daily_limit: number;
  daily_count: number;
  monthly_limit: number;
  is_active: boolean;
  updated_by: number | null;
  updated_at: string;
};

type TransactionLimitListResponse = {
  items: TransactionLimit[];
  total: number;
  page: number;
  page_size: number;
};

export type EffectiveTransactionLimit = {
  tx_type: string;
  applied_scope: string;
  applied_scope_id: number;
  min_amount: number;
  max_amount: number;
  daily_limit: number;
  daily_count: number;
  monthly_limit: number;
};

export type BettingLimit = {
  id: number;
  scope_type: string;
  scope_id: number;
  game_category: string;
  min_bet: number;
  max_bet: number;
  max_daily_loss: number;
  is_active: boolean;
  updated_by: number | null;
  updated_at: string;
};

type BettingLimitListResponse = {
  items: BettingLimit[];
  total: number;
  page: number;
  page_size: number;
};

export type EffectiveBettingLimit = {
  game_category: string;
  applied_scope: string;
  applied_scope_id: number;
  min_bet: number;
  max_bet: number;
  max_daily_loss: number;
};

// ─── Transaction Limit Hooks ─────────────────────────────────────

export function useTransactionLimits(scopeType?: string) {
  const [data, setData] = useState<TransactionLimitListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (scopeType) params.set('scope_type', scopeType);
      const qs = params.toString();
      const result = await apiClient.get<TransactionLimitListResponse>(
        `/api/v1/limits/transactions${qs ? `?${qs}` : ''}`
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction limits');
    } finally {
      setLoading(false);
    }
  }, [scopeType]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useEffectiveTransactionLimits(userId: number) {
  const [data, setData] = useState<EffectiveTransactionLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiClient.get<EffectiveTransactionLimit[]>(`/api/v1/limits/transactions/effective/${userId}`)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}

export async function createTransactionLimit(body: Record<string, unknown>) {
  return apiClient.post<TransactionLimit>('/api/v1/limits/transactions', body);
}

export async function updateTransactionLimit(_id: number, body: Record<string, unknown>) {
  // Backend uses POST upsert (no PUT endpoint)
  return apiClient.post<TransactionLimit>('/api/v1/limits/transactions', body);
}

export async function deleteTransactionLimit(id: number) {
  return apiClient.delete(`/api/v1/limits/transactions/${id}`);
}

// ─── Betting Limit Hooks ─────────────────────────────────────────

export function useBettingLimits(scopeType?: string, gameCategory?: string) {
  const [data, setData] = useState<BettingLimitListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (scopeType) params.set('scope_type', scopeType);
      if (gameCategory) params.set('game_category', gameCategory);
      const qs = params.toString();
      const result = await apiClient.get<BettingLimitListResponse>(
        `/api/v1/limits/betting${qs ? `?${qs}` : ''}`
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load betting limits');
    } finally {
      setLoading(false);
    }
  }, [scopeType, gameCategory]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

export function useEffectiveBettingLimits(userId: number) {
  const [data, setData] = useState<EffectiveBettingLimit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiClient.get<EffectiveBettingLimit[]>(`/api/v1/limits/betting/effective/${userId}`)
      .then(setData)
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}

export async function createBettingLimit(body: Record<string, unknown>) {
  return apiClient.post<BettingLimit>('/api/v1/limits/betting', body);
}

export async function updateBettingLimit(_id: number, body: Record<string, unknown>) {
  // Backend uses POST upsert (no PUT endpoint)
  return apiClient.post<BettingLimit>('/api/v1/limits/betting', body);
}

export async function deleteBettingLimit(id: number) {
  return apiClient.delete(`/api/v1/limits/betting/${id}`);
}
