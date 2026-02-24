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

const TYPE_FILTERS = [
  { value: '', label: '전체' },
  { value: 'deposit', label: '입금' },
  { value: 'withdrawal', label: '출금' },
  { value: 'bet', label: '베팅' },
  { value: 'win', label: '당첨' },
  { value: 'bonus', label: '보너스' },
];

const TYPE_LABEL: Record<string, string> = {
  deposit: '입금',
  withdrawal: '출금',
  bet: '베팅',
  win: '당첨',
  bonus: '보너스',
  commission: '커미션',
  point_convert: '포인트전환',
  admin: '관리자',
};

const formatAmount = (value: string) => {
  const num = Number(value);
  const formatted = new Intl.NumberFormat('ko-KR').format(Math.abs(num));
  return num >= 0 ? `+${formatted}` : `-${formatted}`;
};

const formatBalance = (value: string) =>
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

export default function MoneyPage() {
  const {
    moneyLogs,
    moneyLogsTotal,
    isLoading,
    fetchMoneyLogs,
  } = useProfileStore();

  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchMoneyLogs({
      type: typeFilter || undefined,
      page: currentPage,
      limit: pageSize,
    });
  }, [typeFilter, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(moneyLogsTotal / pageSize);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">머니내역</CardTitle>
        </CardHeader>
      </Card>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TYPE_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={typeFilter === f.value ? 'default' : 'secondary'}
            size="sm"
            onClick={() => { setTypeFilter(f.value); setCurrentPage(1); }}
            className="shrink-0"
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
          ) : moneyLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-4xl">💰</span>
              <p className="text-sm text-muted-foreground">머니내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">유형</TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-right">잔액</TableHead>
                    <TableHead className="text-right">일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moneyLogs.map((log) => {
                    const amount = Number(log.amount);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {TYPE_LABEL[log.type] || log.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.description}</TableCell>
                        <TableCell className={cn(
                          'text-right text-sm font-medium',
                          amount > 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {formatAmount(log.amount)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {formatBalance(log.balanceAfter)}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {formatDateTime(log.createdAt)}
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
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            이전
          </Button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
