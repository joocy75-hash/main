'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';

// ─── Types ───────────────────────────────────────────────────────

export type VipLevel = {
  id: number;
  level: number;
  name: string;
  color: string | null;
  icon: string | null;
  min_total_deposit: number;
  min_total_bet: number;
  rolling_bonus_rate: number;
  losing_bonus_rate: number;
  deposit_limit_daily: number;
  withdrawal_limit_daily: number;
  withdrawal_limit_monthly: number;
  max_single_bet: number;
  benefits: Record<string, unknown>;
  sort_order: number;
  user_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type VipLevelUser = {
  id: number;
  username: string;
  nickname: string | null;
  balance: number;
  total_deposit: number;
  total_bet: number;
  status: string;
};

type VipLevelUserListResponse = {
  items: VipLevelUser[];
  total: number;
  page: number;
  page_size: number;
};

export type UserLevelHistory = {
  id: number;
  user_id: number;
  from_level: number;
  to_level: number;
  reason: string;
  changed_by: number | null;
  changed_by_username: string | null;
  changed_at: string;
};

type UserLevelHistoryResponse = {
  items: UserLevelHistory[];
  total: number;
};

type AutoCheckResult = {
  total_checked: number;
  total_upgraded: number;
  upgrades: { user_id: number; username: string; from_level: number; to_level: number; level_name: string }[];
};

// ─── VIP Level Hooks ─────────────────────────────────────────────

export function useVipLevels() {
  const [items, setItems] = useState<VipLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.get<VipLevel[]>('/api/v1/vip/levels');
      setItems(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VIP levels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { items, loading, error, refetch: fetch };
}

export function useVipLevel(id: number | null) {
  const [data, setData] = useState<VipLevel | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiClient.get<VipLevel>(`/api/v1/vip/levels/${id}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading };
}

export function useVipLevelUsers(level: number | null, page = 1, pageSize = 20) {
  const [data, setData] = useState<VipLevelUserListResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (level === null) return;
    setLoading(true);
    try {
      const result = await apiClient.get<VipLevelUserListResponse>(
        `/api/v1/vip/levels/${level}/users?page=${page}&page_size=${pageSize}`
      );
      setData(result);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [level, page, pageSize]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, refetch: fetch };
}

export function useUserLevelHistory(userId: number | null) {
  const [data, setData] = useState<UserLevelHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    apiClient.get<UserLevelHistoryResponse>(`/api/v1/vip/users/${userId}/history`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [userId]);

  return { data, loading };
}

export async function createVipLevel(body: Record<string, unknown>) {
  return apiClient.post<VipLevel>('/api/v1/vip/levels', body);
}

export async function updateVipLevel(id: number, body: Record<string, unknown>) {
  return apiClient.put<VipLevel>(`/api/v1/vip/levels/${id}`, body);
}

export async function deleteVipLevel(id: number) {
  return apiClient.delete(`/api/v1/vip/levels/${id}`);
}

export async function upgradeUser(userId: number, targetLevel: number, reason?: string) {
  return apiClient.post(`/api/v1/vip/users/${userId}/upgrade`, { target_level: targetLevel, reason });
}

export async function downgradeUser(userId: number, targetLevel: number, reason?: string) {
  return apiClient.post(`/api/v1/vip/users/${userId}/downgrade`, { target_level: targetLevel, reason });
}

export async function runAutoCheck() {
  return apiClient.post<AutoCheckResult>('/api/v1/vip/auto-check', {});
}
