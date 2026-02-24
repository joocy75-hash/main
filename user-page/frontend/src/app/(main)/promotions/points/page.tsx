'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';
import { useWalletStore } from '@/stores/wallet-store';

const CONVERSION_RATE = 100; // 100P = 1 KRW
const MIN_CONVERT = 1000; // Minimum 1,000P

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  attendance: { label: '출석', color: 'text-green-400' },
  mission: { label: '미션', color: 'text-blue-400' },
  spin: { label: '스핀', color: 'text-purple-400' },
  convert: { label: '전환', color: 'text-yellow-400' },
  admin_credit: { label: '지급', color: 'text-green-400' },
  admin_debit: { label: '차감', color: 'text-red-400' },
  payback: { label: '페이백', color: 'text-cyan-400' },
  promotion: { label: '프로모션', color: 'text-orange-400' },
};

export default function PointsPage() {
  const {
    pointHistory,
    isConvertingPoints,
    fetchPointHistory,
    convertPoints,
  } = useEventStore();
  const { points, fetchBalance } = useWalletStore();

  const [convertAmount, setConvertAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBalance();
    fetchPointHistory(1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cashAmount = convertAmount
    ? Math.floor(Number(convertAmount) / CONVERSION_RATE)
    : 0;

  const handleConvert = useCallback(async () => {
    setError('');
    setSuccess('');

    const amount = Number(convertAmount);
    if (!convertAmount || isNaN(amount) || amount <= 0) {
      setError('유효한 금액을 입력하세요');
      return;
    }
    if (amount < MIN_CONVERT) {
      setError(`최소 전환 포인트는 ${MIN_CONVERT.toLocaleString('ko-KR')}P 입니다`);
      return;
    }
    if (amount > Number(points)) {
      setError('보유 포인트가 부족합니다');
      return;
    }

    try {
      const result = await convertPoints(amount);
      setSuccess(
        `${result.pointsUsed.toLocaleString('ko-KR')}P -> ${result.cashReceived.toLocaleString('ko-KR')}원 전환 완료!`
      );
      setConvertAmount('');
      await fetchBalance();
      await fetchPointHistory(1);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '포인트 전환에 실패했습니다');
    }
  }, [convertAmount, points, convertPoints, fetchBalance, fetchPointHistory]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchPointHistory(page);
    },
    [fetchPointHistory]
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const totalPages = pointHistory
    ? Math.ceil(pointHistory.total / 10)
    : 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Balance card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">포인트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">보유 포인트</p>
            <p className="text-2xl font-bold text-yellow-400">
              {Number(points).toLocaleString('ko-KR')} P
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conversion card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            포인트 전환 ({CONVERSION_RATE}P = 1원)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Convert amount input */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              전환할 포인트
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder={`최소 ${MIN_CONVERT.toLocaleString('ko-KR')}`}
                value={convertAmount}
                onChange={(e) => {
                  setConvertAmount(e.target.value);
                  setError('');
                }}
                className="bg-card pr-8"
                min={0}
                step={100}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                P
              </span>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {[1000, 5000, 10000, 50000].map((amt) => (
              <Button
                key={amt}
                variant="outline"
                size="xs"
                onClick={() => setConvertAmount(String(amt))}
              >
                {amt.toLocaleString('ko-KR')}P
              </Button>
            ))}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setConvertAmount(points)}
            >
              전액
            </Button>
          </div>

          <Separator />

          {/* Receive amount */}
          <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRightLeft className="size-4" />
              <span>받을 금액</span>
            </div>
            <span className="text-lg font-bold">
              {cashAmount.toLocaleString('ko-KR')}원
            </span>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-center text-sm font-medium text-green-400">
              {success}
            </div>
          )}

          {/* Convert button */}
          <Button
            size="lg"
            onClick={handleConvert}
            disabled={isConvertingPoints || !convertAmount || cashAmount <= 0}
            className="w-full"
          >
            {isConvertingPoints ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '전환하기'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Point history */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">포인트 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {!pointHistory || pointHistory.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="text-2xl">💎</span>
              <p className="text-sm text-muted-foreground">
                포인트 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일시</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead className="text-right">잔여</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointHistory.items.map((item) => {
                      const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-muted-foreground' };
                      const isPositive = Number(item.amount) > 0;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDate(item.createdAt)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn('text-xs', typeInfo.color)}>
                              {typeInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            'text-right text-sm font-medium',
                            isPositive ? 'text-green-400' : 'text-red-400'
                          )}>
                            {isPositive ? '+' : ''}{Number(item.amount).toLocaleString('ko-KR')}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {Number(item.balance).toLocaleString('ko-KR')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {pointHistory.items.map((item) => {
                  const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-muted-foreground' };
                  const isPositive = Number(item.amount) > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className={cn('text-[10px]', typeInfo.color)}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-sm font-semibold',
                          isPositive ? 'text-green-400' : 'text-red-400'
                        )}>
                          {isPositive ? '+' : ''}{Number(item.amount).toLocaleString('ko-KR')}P
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          잔여: {Number(item.balance).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    이전
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                  >
                    다음
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
