'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';

const CATEGORY_FILTERS = [
  { value: '', label: '전체' },
  { value: 'casino', label: '카지노' },
  { value: 'slot', label: '슬롯' },
  { value: 'holdem', label: '홀덤' },
  { value: 'sports', label: '스포츠' },
  { value: 'shooting', label: '슈팅' },
  { value: 'coin', label: '코인' },
  { value: 'mini_game', label: '미니게임' },
];

const DATE_FILTERS = [
  { value: 'today', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: 'all', label: '전체' },
];

const RESULT_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  win: { label: '승리', variant: 'default' },
  lose: { label: '패배', variant: 'destructive' },
  draw: { label: '무승부', variant: 'secondary' },
  pending: { label: '대기', variant: 'outline' },
};

const formatAmount = (value: string) =>
  new Intl.NumberFormat('ko-KR').format(Number(value));

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getDateRange = (filter: string) => {
  const now = new Date();
  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (filter === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  if (filter === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { startDate: start.toISOString(), endDate: now.toISOString() };
  }
  return {};
};

export default function BetsPage() {
  const {
    bets,
    betsTotal,
    betsPage,
    betsHasMore,
    isLoading,
    fetchBets,
  } = useProfileStore();

  const [category, setCategory] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    const dateRange = getDateRange(dateFilter);
    fetchBets({
      category: category || undefined,
      ...dateRange,
      page: 1,
      limit: 20,
    });
  }, [category, dateFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = (page: number) => {
    const dateRange = getDateRange(dateFilter);
    fetchBets({
      category: category || undefined,
      ...dateRange,
      page,
      limit: 20,
    });
  };

  const totalPages = Math.ceil(betsTotal / 20);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">베팅내역</CardTitle>
        </CardHeader>
      </Card>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORY_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={category === f.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setCategory(f.value)}
            className="shrink-0"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex gap-2">
        {DATE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={dateFilter === f.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : bets.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">📋</span>
              <p className="text-sm text-muted-foreground">베팅내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">종목</TableHead>
                    <TableHead>게임</TableHead>
                    <TableHead className="text-right">베팅액</TableHead>
                    <TableHead className="text-right">당첨액</TableHead>
                    <TableHead className="text-center">결과</TableHead>
                    <TableHead className="text-right">일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bets.map((bet) => {
                    const resultInfo = RESULT_BADGE[bet.result] || RESULT_BADGE.pending;
                    return (
                      <TableRow key={bet.id}>
                        <TableCell className="text-xs">
                          {CATEGORY_FILTERS.find((c) => c.value === bet.gameCategory)?.label || bet.gameCategory}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{bet.gameName}</TableCell>
                        <TableCell className="text-right text-sm">{formatAmount(bet.betAmount)}</TableCell>
                        <TableCell className={cn(
                          'text-right text-sm',
                          Number(bet.winAmount) > 0 && 'text-green-400'
                        )}>
                          {formatAmount(bet.winAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={resultInfo.variant} className="text-[10px]">
                            {resultInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDateTime(bet.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={betsPage <= 1}
            onClick={() => handlePageChange(betsPage - 1)}
          >
            이전
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={betsPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={!betsHasMore}
            onClick={() => handlePageChange(betsPage + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
