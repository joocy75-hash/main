'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  updatePolicy,
  useOverrides,
  createOverride,
  deleteOverride,
  type CommissionPolicy,
} from '@/hooks/use-commissions';
import { useToast } from '@/components/toast-provider';

const TYPE_LABELS: Record<string, string> = {
  rolling: '롤링',
  losing: '루징 (죽장)',
  deposit: '입금',
};

export default function PolicyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();
  const policyId = Number(params.id);

  const [policy, setPolicy] = useState<CommissionPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'edit' | 'overrides'>('edit');

  // Form state
  const [name, setName] = useState('');
  const [levelRates, setLevelRates] = useState<Record<string, string>>({});
  const [minBetAmount, setMinBetAmount] = useState('0');
  const [priority, setPriority] = useState('0');
  const [active, setActive] = useState(true);

  // Override state
  const { data: overrides, refetch: refetchOverrides } = useOverrides(undefined, policyId);
  const [newAgentId, setNewAgentId] = useState('');
  const [newOverrideRates, setNewOverrideRates] = useState('');

  useEffect(() => {
    apiClient.get<CommissionPolicy>(`/api/v1/commissions/policies/${policyId}`)
      .then((p) => {
        setPolicy(p);
        setName(p.name);
        const ratesStr: Record<string, string> = {};
        for (const [k, v] of Object.entries(p.level_rates)) {
          ratesStr[k] = String(v);
        }
        setLevelRates(ratesStr);
        setMinBetAmount(String(p.min_bet_amount));
        setPriority(String(p.priority));
        setActive(p.active);
      })
      .catch(() => setError('정책을 불러올 수 없습니다'))
      .finally(() => setLoading(false));
  }, [policyId]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const rates: Record<string, number> = {};
      for (const [k, v] of Object.entries(levelRates)) {
        const num = parseFloat(v);
        if (!isNaN(num) && num > 0) rates[k] = num;
      }
      const updated = await updatePolicy(policyId, {
        name,
        level_rates: rates,
        min_bet_amount: parseFloat(minBetAmount) || 0,
        priority: parseInt(priority) || 0,
        active,
      });
      setPolicy(updated);
      toast.success('저장되었습니다');
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleAddOverride = async () => {
    if (!newAgentId || !newOverrideRates) return;
    try {
      const rates: Record<string, number> = {};
      for (const part of newOverrideRates.split(',')) {
        const [lvl, rate] = part.trim().split(':');
        if (lvl && rate) rates[lvl.trim()] = parseFloat(rate.trim());
      }
      await createOverride({
        admin_user_id: parseInt(newAgentId),
        policy_id: policyId,
        custom_rates: rates,
      });
      setNewAgentId('');
      setNewOverrideRates('');
      refetchOverrides();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오버라이드 생성 실패');
    }
  };

  const handleDeleteOverride = async (id: number) => {
    if (!confirm('이 오버라이드를 삭제하시겠습니까?')) return;
    await deleteOverride(id);
    refetchOverrides();
  };

  if (loading) return <p className="text-muted-foreground">로딩 중...</p>;
  if (!policy) return <p className="text-destructive">정책을 찾을 수 없습니다</p>;

  const levelKeys = Object.keys(levelRates).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{policy.name}</h1>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABELS[policy.type] || policy.type}
            {policy.game_category ? ` / ${policy.game_category}` : ' / 전체 카테고리'}
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/commissions')}
          className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
        >
          목록으로
        </button>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-4 text-destructive">{error}</div>}

      {/* Tabs */}
      <div className="flex border-b">
        {(['edit', 'overrides'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === t ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'edit' ? '정책 설정' : `오버라이드 (${overrides.length})`}
          </button>
        ))}
      </div>

      {/* Edit Tab */}
      {tab === 'edit' && (
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">정책명</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">상태</label>
              <select
                value={active ? 'active' : 'inactive'}
                onChange={(e) => setActive(e.target.value === 'active')}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground">최소 베팅금</label>
              <input
                type="number"
                value={minBetAmount}
                onChange={(e) => setMinBetAmount(e.target.value)}
                min="0"
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">우선순위</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">단계별 비율 (%)</label>
            <div className="space-y-2">
              {levelKeys.map((lvl) => (
                <div key={lvl} className="flex items-center gap-3">
                  <span className="w-20 text-sm text-muted-foreground">{lvl}단계:</span>
                  <input
                    type="number"
                    value={levelRates[lvl] || '0'}
                    onChange={(e) => setLevelRates({ ...levelRates, [lvl]: e.target.value })}
                    step="0.01"
                    min="0"
                    className="w-32 rounded-md border border-border px-3 py-2 text-sm bg-background"
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                const next = String(levelKeys.length + 1);
                setLevelRates({ ...levelRates, [next]: '0' });
              }}
              className="mt-2 text-sm text-primary hover:text-primary/80"
            >
              + 단계 추가
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '변경사항 저장'}
          </button>
        </div>
      )}

      {/* Overrides Tab */}
      {tab === 'overrides' && (
        <div className="space-y-4">
          {/* Add override */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-foreground mb-3">에이전트 오버라이드 추가</h3>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-xs text-muted-foreground">에이전트 ID</label>
                <input
                  type="number"
                  value={newAgentId}
                  onChange={(e) => setNewAgentId(e.target.value)}
                  placeholder="에이전트 ID"
                  className="mt-1 w-28 rounded-md border border-border px-3 py-2 text-sm bg-background"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground">커스텀 비율 (예: 1:0.8, 2:0.5, 3:0.2)</label>
                <input
                  type="text"
                  value={newOverrideRates}
                  onChange={(e) => setNewOverrideRates(e.target.value)}
                  placeholder="1:0.8, 2:0.5, 3:0.2"
                  className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm bg-background"
                />
              </div>
              <button
                onClick={handleAddOverride}
                disabled={!newAgentId || !newOverrideRates}
                className="rounded-md bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </div>

          {/* Override list */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">에이전트</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">코드</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">커스텀 비율</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">상태</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {overrides.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 text-sm">{o.agent_username || o.admin_user_id}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{o.agent_code}</td>
                    <td className="px-4 py-3 text-sm">
                      {o.custom_rates
                        ? Object.entries(o.custom_rates)
                            .sort(([a], [b]) => Number(a) - Number(b))
                            .map(([k, v]) => `L${k}: ${v}%`)
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        o.active ? 'bg-green-500/10 text-green-500' : 'bg-muted text-foreground'
                      }`}>
                        {o.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteOverride(o.id)}
                        className="text-red-400 hover:text-red-500"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
                {overrides.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      이 정책에 대한 오버라이드가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
