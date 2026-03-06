'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useExchangeRates,
  createExchangeRate,
  updateExchangeRate,
  type ExchangeRate,
} from '@/hooks/use-reward-settings';
import { useToast } from '@/components/toast-provider';

const DEFAULT_PAIRS = ['USDT/KRW', 'TRX/KRW', 'ETH/KRW', 'BTC/KRW', 'BNB/KRW'];

const rateFormatter = new Intl.NumberFormat('ko-KR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

type FormData = {
  pair: string;
  rate: string;
  source: string;
  is_active: boolean;
};

const defaultForm: FormData = {
  pair: 'USDT/KRW',
  rate: '',
  source: '',
  is_active: true,
};

export default function ExchangeRatesPage() {
  const { data, loading, error, refetch } = useExchangeRates();
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ExchangeRate | null>(null);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingItem(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (item: ExchangeRate) => {
    setEditingItem(item);
    setForm({
      pair: item.pair,
      rate: String(item.rate),
      source: item.source,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.pair || !form.rate) {
      toast.warning('통화쌍과 환율을 입력해주세요.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        pair: form.pair,
        rate: Number(form.rate),
        source: form.source,
        is_active: form.is_active,
      };
      if (editingItem) {
        await updateExchangeRate(editingItem.id, body);
      } else {
        await createExchangeRate(body);
      }
      setShowForm(false);
      setEditingItem(null);
      setForm(defaultForm);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm(defaultForm);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">환율 관리</h1>
          <p className="text-sm text-muted-foreground">암호화폐 환율을 관리합니다.</p>
        </div>
        <Button onClick={openCreate}>+ 환율 등록</Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingItem ? '환율 수정' : '환율 등록'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">통화쌍</label>
                <select
                  value={form.pair}
                  onChange={(e) => setForm({ ...form, pair: e.target.value })}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  {DEFAULT_PAIRS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">환율</label>
                <Input
                  type="number"
                  step="0.000001"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  placeholder="예: 1350.50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">소스</label>
                <Input
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="예: Binance, CoinGecko"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">활성</label>
                <select
                  value={form.is_active ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                  className="w-full rounded-md border border-border px-3 py-2 text-sm"
                >
                  <option value="true">활성</option>
                  <option value="false">비활성</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : editingItem ? '수정' : '등록'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>취소</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 환율이 없습니다
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">통화쌍</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">환율</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">소스</th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">활성</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">수정일</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-accent">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">{item.pair}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono tabular-nums">
                    {rateFormatter.format(item.rate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {item.source || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      item.is_active
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-muted text-foreground'
                    }`}>
                      {item.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                    {new Date(item.updated_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <button
                      onClick={() => openEdit(item)}
                      className="text-primary hover:text-primary/80"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
