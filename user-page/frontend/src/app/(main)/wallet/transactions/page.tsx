'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useWalletStore } from '@/stores/wallet-store';
import type { Transaction } from '@/stores/wallet-store';

type TypeFilter = 'all' | 'deposit' | 'withdrawal';
type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type PeriodFilter = 'today' | '7d' | '30d';

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'deposit', label: '입금' },
  { value: 'withdrawal', label: '출금' },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'pending', label: '대기' },
  { value: 'approved', label: '완료' },
  { value: 'rejected', label: '거부' },
];

const PAGE_SIZE = 10;

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: '대기중', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    approved: { label: '완료', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    rejected: { label: '거부', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const v = variants[status] || variants.pending;
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  if (type === 'deposit') {
    return (
      <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400">
        입금
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-400">
      출금
    </Badge>
  );
};

export default function TransactionsPage() {
  const {
    transactions,
    transactionsTotal,
    transactionsPage,
    transactionsHasMore,
    isLoading,
    fetchTransactions,
  } = useWalletStore();

  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(transactionsTotal / PAGE_SIZE));

  const loadTransactions = useCallback(
    (page: number) => {
      fetchTransactions({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
      });
    },
    [typeFilter, statusFilter, fetchTransactions]
  );

  useEffect(() => {
    setCurrentPage(1);
    loadTransactions(1);
  }, [typeFilter, statusFilter, periodFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      loadTransactions(page);
    },
    [loadTransactions]
  );

  const handleCopyHash = useCallback(async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  const formatAmount = (tx: Transaction) => {
    const num = parseFloat(tx.amount);
    const formatted = num.toLocaleString('ko-KR');
    if (tx.type === 'deposit') return `+${formatted}`;
    return `-${formatted}`;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">거래 내역</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Type tabs */}
            <div className="flex gap-1 rounded-lg border border-border bg-secondary/30 p-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    typeFilter === tab.value
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Period filter */}
              <Select
                value={periodFilter}
                onValueChange={(val) => setPeriodFilter(val as PeriodFilter)}
              >
                <SelectTrigger className="h-8 w-24 bg-card text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="7d">7일</SelectItem>
                  <SelectItem value="30d">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  statusFilter === sf.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                {sf.label}
              </button>
            ))}
          </div>

          {/* Table / List */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                거래 내역이 없습니다
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
                      <TableHead>코인</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead className="text-center">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: Transaction) => (
                      <TableRow key={`${tx.type}-${tx.id}`}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(tx.createdAt)}
                        </TableCell>
                        <TableCell>
                          <TypeBadge type={tx.type} />
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {tx.coinType}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right text-sm font-medium',
                            tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                          )}
                        >
                          {formatAmount(tx)}
                        </TableCell>
                        <TableCell>
                          {tx.txHash ? (
                            <button
                              onClick={() => handleCopyHash(tx.txHash!)}
                              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                            >
                              {truncateHash(tx.txHash)}
                              {copiedHash === tx.txHash ? (
                                <Check className="size-3 text-green-400" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={tx.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {transactions.map((tx: Transaction) => (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="rounded-lg border border-border bg-secondary/30 px-3 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={tx.type} />
                        <span className="text-sm font-medium">{tx.coinType}</span>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        )}
                      >
                        {formatAmount(tx)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                    {tx.txHash && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => handleCopyHash(tx.txHash!)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          TX: {truncateHash(tx.txHash)}
                          {copiedHash === tx.txHash ? (
                            <Check className="size-3 text-green-400" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 pt-2">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>

                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className="size-8 p-0 text-xs"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!transactionsHasMore && currentPage >= totalPages}
                  >
                    <ChevronRight className="size-4" />
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
