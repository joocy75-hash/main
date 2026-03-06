'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Ticket, AlertCircle, Plus, Copy, Trash2, Layers, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  useCoupons,
  usePromotions,
  createCoupon,
  batchCreateCoupons,
  redeemCoupon,
  deleteCoupon,
} from '@/hooks/use-promotions';
import { useToast } from '@/components/toast-provider';

export default function CouponsPage() {
  const router = useRouter();
  const [promotionFilter, setPromotionFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const toast = useToast();
  const { data: promotionsData } = usePromotions({ page_size: 100 });
  const { data, loading, error, refetch } = useCoupons({
    page,
    page_size: 20,
    promotion_id: promotionFilter ? Number(promotionFilter) : undefined,
    is_active: activeFilter === '' ? undefined : activeFilter === 'true',
  });

  // Create single coupon dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    promotion_id: '',
    code: '',
    max_uses: '1',
    expires_at: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Batch create dialog
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchForm, setBatchForm] = useState({
    promotion_id: '',
    count: '10',
    prefix: '',
  });
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState('');
  const [batchResult, setBatchResult] = useState<number | null>(null);

  // Redeem dialog
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [redeemForm, setRedeemForm] = useState({
    user_id: '',
    code: '',
  });
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const handleCreateCoupon = async () => {
    if (!createForm.promotion_id) {
      setCreateError('프로모션을 선택하세요');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const body: Record<string, unknown> = {
        promotion_id: Number(createForm.promotion_id),
        max_uses: parseInt(createForm.max_uses) || 1,
      };
      if (createForm.code.trim()) body.code = createForm.code.trim();
      if (createForm.expires_at) body.expires_at = createForm.expires_at;
      await createCoupon(body);
      setCreateOpen(false);
      setCreateForm({ promotion_id: '', code: '', max_uses: '1', expires_at: '' });
      refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : '생성 실패');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleBatchCreate = async () => {
    if (!batchForm.promotion_id) {
      setBatchError('프로모션을 선택하세요');
      return;
    }
    const count = parseInt(batchForm.count);
    if (!count || count < 1 || count > 1000) {
      setBatchError('수량은 1~1000 사이를 입력하세요');
      return;
    }
    setBatchLoading(true);
    setBatchError('');
    setBatchResult(null);
    try {
      const result = await batchCreateCoupons({
        promotionId: Number(batchForm.promotion_id),
        count,
        prefix: batchForm.prefix || undefined,
      });
      setBatchResult(result.created);
      refetch();
    } catch (err) {
      setBatchError(err instanceof Error ? err.message : '대량 생성 실패');
    } finally {
      setBatchLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemForm.user_id || !redeemForm.code.trim()) {
      setRedeemError('회원 ID와 쿠폰 코드를 입력하세요');
      return;
    }
    setRedeemLoading(true);
    setRedeemError('');
    setRedeemSuccess(false);
    try {
      await redeemCoupon({
        userId: Number(redeemForm.user_id),
        code: redeemForm.code.trim(),
      });
      setRedeemSuccess(true);
      refetch();
    } catch (err) {
      setRedeemError(err instanceof Error ? err.message : '쿠폰 사용 실패');
    } finally {
      setRedeemLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    try {
      await deleteCoupon(id);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/promotions')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">쿠폰 관리</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              쿠폰 코드를 생성하고 관리합니다.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* Redeem Button */}
          <Dialog open={redeemOpen} onOpenChange={(open) => { setRedeemOpen(open); if (!open) { setRedeemForm({ user_id: '', code: '' }); setRedeemError(''); setRedeemSuccess(false); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <UserCheck className="mr-1.5 h-3.5 w-3.5" />쿠폰 사용
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>쿠폰 사용 (Redeem)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {redeemError && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{redeemError}</div>
                )}
                {redeemSuccess && (
                  <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm">쿠폰이 정상적으로 적용되었습니다.</div>
                )}
                <div className="space-y-2">
                  <Label>회원 ID *</Label>
                  <Input
                    type="number"
                    value={redeemForm.user_id}
                    onChange={(e) => setRedeemForm({ ...redeemForm, user_id: e.target.value })}
                    placeholder="회원 ID를 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label>쿠폰 코드 *</Label>
                  <Input
                    value={redeemForm.code}
                    onChange={(e) => setRedeemForm({ ...redeemForm, code: e.target.value })}
                    placeholder="쿠폰 코드를 입력하세요"
                    className="font-mono"
                  />
                </div>
                <Button onClick={handleRedeem} disabled={redeemLoading} className="w-full">
                  {redeemLoading ? '처리 중...' : '쿠폰 사용'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Batch Create Button */}
          <Dialog open={batchOpen} onOpenChange={(open) => { setBatchOpen(open); if (!open) { setBatchForm({ promotion_id: '', count: '10', prefix: '' }); setBatchError(''); setBatchResult(null); } }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Layers className="mr-1.5 h-3.5 w-3.5" />대량 생성
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>쿠폰 대량 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {batchError && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{batchError}</div>
                )}
                {batchResult !== null && (
                  <div className="bg-green-500/10 text-green-500 px-4 py-3 rounded-md text-sm">
                    {batchResult}개의 쿠폰이 생성되었습니다.
                  </div>
                )}
                <div className="space-y-2">
                  <Label>프로모션 *</Label>
                  <select
                    value={batchForm.promotion_id}
                    onChange={(e) => setBatchForm({ ...batchForm, promotion_id: e.target.value })}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">프로모션 선택</option>
                    {promotionsData?.items.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>수량 *</Label>
                    <Input
                      type="number"
                      min="1"
                      max="1000"
                      value={batchForm.count}
                      onChange={(e) => setBatchForm({ ...batchForm, count: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>접두사</Label>
                    <Input
                      value={batchForm.prefix}
                      onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                      placeholder="예: VIP"
                      className="font-mono"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">최대 1,000개까지 생성 가능합니다.</p>
                <Button onClick={handleBatchCreate} disabled={batchLoading} className="w-full">
                  {batchLoading ? '생성 중...' : '대량 생성'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Create Single Button */}
          <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) { setCreateForm({ promotion_id: '', code: '', max_uses: '1', expires_at: '' }); setCreateError(''); } }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />쿠폰 생성
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>쿠폰 생성</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {createError && (
                  <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">{createError}</div>
                )}
                <div className="space-y-2">
                  <Label>프로모션 *</Label>
                  <select
                    value={createForm.promotion_id}
                    onChange={(e) => setCreateForm({ ...createForm, promotion_id: e.target.value })}
                    className="w-full rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <option value="">프로모션 선택</option>
                    {promotionsData?.items.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>쿠폰 코드</Label>
                  <Input
                    value={createForm.code}
                    onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                    placeholder="비워두면 자동 생성"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">비워두면 랜덤 코드가 생성됩니다.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>최대 사용 횟수</Label>
                    <Input
                      type="number"
                      min="1"
                      value={createForm.max_uses}
                      onChange={(e) => setCreateForm({ ...createForm, max_uses: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>만료일</Label>
                    <Input
                      type="datetime-local"
                      value={createForm.expires_at}
                      onChange={(e) => setCreateForm({ ...createForm, expires_at: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleCreateCoupon} disabled={createLoading} className="w-full">
                  {createLoading ? '생성 중...' : '쿠폰 생성'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex gap-4 flex-wrap">
            <select
              value={promotionFilter}
              onChange={(e) => { setPromotionFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">전체 프로모션</option>
              {promotionsData?.items.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={activeFilter}
              onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
              className="rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">전체 상태</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-destructive">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-lg font-medium">데이터를 불러오지 못했습니다</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
          <Button variant="outline" className="mt-4" onClick={refetch}>다시 시도</Button>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Ticket className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">등록된 쿠폰이 없습니다</p>
          <p className="text-sm">쿠폰을 생성해주세요.</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">코드</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">프로모션</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">최대사용</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">사용횟수</th>
                    <th className="px-4 py-3 text-center text-xs font-medium uppercase text-muted-foreground">상태</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">만료일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">생성일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-muted-foreground">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {data!.items.map((coupon) => {
                    const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
                    const isFullyUsed = coupon.used_count >= coupon.max_uses;
                    return (
                      <tr key={coupon.id} className="hover:bg-accent">
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <code className="font-mono text-sm bg-muted px-2 py-0.5 rounded">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => handleCopyCode(coupon.code)}
                              className="text-muted-foreground hover:text-foreground"
                              title="코드 복사"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {coupon.promotion_name || `ID: ${coupon.promotion_id}`}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-center font-mono tabular-nums">
                          {coupon.max_uses}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                          <span className={`font-mono tabular-nums ${isFullyUsed ? 'text-red-400 font-medium' : ''}`}>
                            {coupon.used_count}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-center">
                          {isExpired ? (
                            <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-muted text-foreground">
                              만료
                            </span>
                          ) : isFullyUsed ? (
                            <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-orange-500/10 text-orange-500">
                              소진
                            </span>
                          ) : coupon.is_active ? (
                            <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-green-500/10 text-green-500">
                              활성
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold bg-muted text-foreground">
                              비활성
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {coupon.expires_at
                            ? new Date(coupon.expires_at).toLocaleDateString('ko-KR')
                            : '-'}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                          {new Date(coupon.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-500" title="삭제">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>쿠폰 삭제</AlertDialogTitle>
                                <AlertDialogDescription>
                                  쿠폰 코드 &quot;{coupon.code}&quot;를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                >
                                  삭제
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Pagination */}
      {data && data.total > data.page_size && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            전체: {data.total}개
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              이전
            </button>
            <span className="px-3 py-1 text-sm">
              {data.page} / {Math.ceil(data.total / data.page_size)}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= Math.ceil(data.total / data.page_size)}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
