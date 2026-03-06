'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/toast-provider';
import {
  useAttendanceConfigs,
  createAttendanceConfig,
  updateAttendanceConfig,
  type AttendanceConfig,
} from '@/hooks/use-reward-settings';

const fmt = (n: number) => Intl.NumberFormat('ko-KR').format(n);

const REWARD_TYPE_STYLES: Record<string, { label: string; cls: string }> = {
  cash: { label: '캐시', cls: 'bg-blue-500/10 text-blue-500' },
  bonus: { label: '보너스', cls: 'bg-green-500/10 text-green-500' },
  point: { label: '포인트', cls: 'bg-purple-500/10 text-purple-500' },
};

type FormData = {
  day_number: string;
  reward_amount: string;
  reward_type: string;
  is_active: boolean;
};

const defaultForm: FormData = {
  day_number: '1',
  reward_amount: '0',
  reward_type: 'cash',
  is_active: true,
};

export default function AttendancePage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useAttendanceConfigs();
  const [editing, setEditing] = useState<AttendanceConfig | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setShowForm(true);
  };

  const openEdit = (item: AttendanceConfig) => {
    setEditing(item);
    setForm({
      day_number: String(item.day_number),
      reward_amount: String(item.reward_amount),
      reward_type: item.reward_type,
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = {
        day_number: Number(form.day_number),
        reward_amount: Number(form.reward_amount),
        reward_type: form.reward_type as 'cash' | 'bonus' | 'point',
        is_active: form.is_active,
      };
      if (editing) {
        await updateAttendanceConfig(editing.id, body);
        toast.success('출석 보상이 수정되었습니다');
      } else {
        await createAttendanceConfig(body);
        toast.success('출석 보상이 등록되었습니다');
      }
      setShowForm(false);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">출석 보상 설정</h1>
          <p className="text-sm text-muted-foreground">1~30일 출석 보상을 관리합니다.</p>
        </div>
        <Button onClick={openCreate}>+ 추가</Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground">로딩 중...</p>
      ) : data.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            등록된 출석 보상이 없습니다
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">일차</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-muted-foreground">보상금액</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">보상유형</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">활성</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {data.map((item) => {
                    const typeStyle = REWARD_TYPE_STYLES[item.reward_type];
                    return (
                      <tr key={item.id} className="hover:bg-accent">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                          {item.day_number}일차
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-right font-mono tabular-nums">
                          {fmt(item.reward_amount)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${typeStyle?.cls || 'bg-muted text-foreground'}`}>
                            {typeStyle?.label || item.reward_type}
                          </span>
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
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>수정</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? '출석 보상 수정' : '출석 보상 등록'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>일차 (1~30)</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={form.day_number}
                onChange={(e) => setForm({ ...form, day_number: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>보상금액</Label>
              <Input
                type="number"
                min="0"
                value={form.reward_amount}
                onChange={(e) => setForm({ ...form, reward_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>보상유형</Label>
              <select
                value={form.reward_type}
                onChange={(e) => setForm({ ...form, reward_type: e.target.value })}
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              >
                <option value="cash">캐시</option>
                <option value="bonus">보너스</option>
                <option value="point">포인트</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="attendance-active"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="attendance-active">활성</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : editing ? '수정' : '등록'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
