'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    pending: { label: '대기중', className: 'bg-yellow-50 text-yellow-600' },
    approved: { label: '완료', className: 'bg-green-50 text-green-600' },
    rejected: { label: '거부', className: 'bg-red-50 text-red-500' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', v.className)}>
      {v.label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: string }) => {
  if (type === 'deposit') {
    return (
      <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
        입금
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-500">
      출금
    </span>
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
      <div className="rounded-lg bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-[#dddddd] px-5 py-4">
          <h2 className="text-lg font-bold text-[#252531]">거래 내역</h2>
        </div>

        <div className="flex flex-col gap-4 p-5">
          {/* Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Type tabs */}
            <div className="flex gap-1 rounded-lg bg-[#f8f9fc] p-1">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    typeFilter === tab.value
                      ? 'bg-[#f4b53e] text-white'
                      : 'text-[#707070] hover:text-[#252531]'
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
                <SelectTrigger className="h-8 w-24 border-[#dddddd] bg-white text-xs">
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
                    ? 'border-[#f4b53e] bg-[#f4b53e] text-white'
                    : 'border-[#dddddd] text-[#707070] hover:border-[#f4b53e] hover:text-[#252531]'
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
                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-[#edeef3]" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <p className="text-sm text-[#707070]">
                거래 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f8f9fc]">
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#707070]">일시</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#707070]">유형</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#707070]">코인</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-[#707070]">금액</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-[#707070]">TX Hash</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-[#707070]">상태</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dddddd]">
                    {transactions.map((tx: Transaction) => (
                      <tr key={`${tx.type}-${tx.id}`} className="hover:bg-[#f8f9fc] transition-colors">
                        <td className="px-4 py-3 text-sm text-[#707070]">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-[#252531]">
                          {tx.coinType}
                        </td>
                        <td
                          className={cn(
                            'px-4 py-3 text-right text-sm font-medium',
                            tx.type === 'deposit' ? 'text-green-600' : 'text-red-500'
                          )}
                        >
                          {formatAmount(tx)}
                        </td>
                        <td className="px-4 py-3">
                          {tx.txHash ? (
                            <button
                              onClick={() => handleCopyHash(tx.txHash!)}
                              className="inline-flex items-center gap-1 font-mono text-xs text-[#707070] transition-colors hover:text-[#252531]"
                            >
                              {truncateHash(tx.txHash)}
                              {copiedHash === tx.txHash ? (
                                <Check className="size-3 text-green-600" />
                              ) : (
                                <Copy className="size-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-xs text-[#707070]">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {transactions.map((tx: Transaction) => (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="rounded-lg border border-[#dddddd] bg-[#f8f9fc] px-3 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={tx.type} />
                        <span className="text-sm font-medium text-[#252531]">{tx.coinType}</span>
                      </div>
                      <span
                        className={cn(
                          'text-sm font-semibold',
                          tx.type === 'deposit' ? 'text-green-600' : 'text-red-500'
                        )}
                      >
                        {formatAmount(tx)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-[#707070]">
                        {formatDate(tx.createdAt)}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                    {tx.txHash && (
                      <div className="mt-1.5">
                        <button
                          onClick={() => handleCopyHash(tx.txHash!)}
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-[#707070] transition-colors hover:text-[#252531]"
                        >
                          TX: {truncateHash(tx.txHash)}
                          {copiedHash === tx.txHash ? (
                            <Check className="size-3 text-green-600" />
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
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-[#dddddd] bg-white text-[#707070] transition-colors hover:bg-[#f8f9fc] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4" />
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        'inline-flex size-8 items-center justify-center rounded-md text-xs font-medium transition-colors',
                        page === currentPage
                          ? 'bg-[#f4b53e] text-white'
                          : 'border border-[#dddddd] bg-white text-[#707070] hover:bg-[#f8f9fc]'
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!transactionsHasMore && currentPage >= totalPages}
                    className="inline-flex size-8 items-center justify-center rounded-md border border-[#dddddd] bg-white text-[#707070] transition-colors hover:bg-[#f8f9fc] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
