'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useOverrides,
  usePolicyList,
  createOverride,
  deleteOverride,
} from '@/hooks/use-commissions';
import { useToast } from '@/components/toast-provider';

export default function OverridesPage() {
  const toast = useToast();
  const [agentIdFilter, setAgentIdFilter] = useState('');
  const [policyIdFilter, setPolicyIdFilter] = useState('');

  const { data: overrides, loading, refetch } = useOverrides(
    agentIdFilter ? Number(agentIdFilter) : undefined,
    policyIdFilter ? Number(policyIdFilter) : undefined,
  );

  const { data: policies } = usePolicyList({ page_size: 100 });

  // New override form
  const [showForm, setShowForm] = useState(false);
  const [newAgentId, setNewAgentId] = useState('');
  const [newPolicyId, setNewPolicyId] = useState('');
  const [newRates, setNewRates] = useState('');

  const handleAdd = async () => {
    if (!newAgentId || !newPolicyId || !newRates) return;
    try {
      const rates: Record<string, number> = {};
      for (const part of newRates.split(',')) {
        const [lvl, rate] = part.trim().split(':');
        if (lvl && rate) rates[lvl.trim()] = parseFloat(rate.trim());
      }
      await createOverride({
        admin_user_id: parseInt(newAgentId),
        policy_id: parseInt(newPolicyId),
        custom_rates: rates,
      });
      setNewAgentId('');
      setNewPolicyId('');
      setNewRates('');
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '생성 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 오버라이드를 삭제하시겠습니까?')) return;
    await deleteOverride(id);
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">에이전트 커미션 오버라이드</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/commissions">
            <button className="rounded-md border border-border bg-card px-4 py-2 text-sm hover:bg-accent">
              정책 목록
            </button>
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? '취소' : '+ 오버라이드 등록'}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <h3 className="font-medium">오버라이드 등록</h3>
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="block text-xs text-muted-foreground">에이전트 ID</label>
              <input
                type="number"
                value={newAgentId}
                onChange={(e) => setNewAgentId(e.target.value)}
                className="mt-1 w-28 rounded-md border border-border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">정책</label>
              <select
                value={newPolicyId}
                onChange={(e) => setNewPolicyId(e.target.value)}
                className="mt-1 w-64 rounded-md border border-border px-3 py-2 text-sm bg-background"
              >
                <option value="">정책 선택...</option>
                {policies?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.type}] {p.name} {p.game_category ? `(${p.game_category})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-muted-foreground">커스텀 비율 (예: 1:0.8, 2:0.5, 3:0.2)</label>
              <input
                type="text"
                value={newRates}
                onChange={(e) => setNewRates(e.target.value)}
                placeholder="1:0.8, 2:0.5, 3:0.2"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
              />
            </div>
            <button
              onClick={handleAdd}
              disabled={!newAgentId || !newPolicyId || !newRates}
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
            >
              등록
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="number"
          value={agentIdFilter}
          onChange={(e) => setAgentIdFilter(e.target.value)}
          placeholder="에이전트 ID"
          className="w-28 rounded-md border border-border px-3 py-2 text-sm bg-background"
        />
        <select
          value={policyIdFilter}
          onChange={(e) => setPolicyIdFilter(e.target.value)}
          className="rounded-md border border-border px-3 py-2 text-sm bg-background"
        >
          <option value="">전체 정책</option>
          {policies?.items.map((p) => (
            <option key={p.id} value={p.id}>
              [{p.type}] {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">에이전트</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">코드</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">정책</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">커스텀 비율</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {overrides.map((o) => (
                <tr key={o.id} className="hover:bg-accent">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{o.id}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                    {o.agent_username || o.admin_user_id}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">{o.agent_code}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{o.policy_name || o.policy_id}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {o.custom_rates
                      ? Object.entries(o.custom_rates)
                          .sort(([a], [b]) => Number(a) - Number(b))
                          .map(([k, v]) => `L${k}: ${v}%`)
                          .join(', ')
                      : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      o.active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-foreground'
                    }`}>
                      {o.active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() => handleDelete(o.id)}
                      className="text-red-400 hover:text-red-500"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {overrides.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    등록된 오버라이드가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
