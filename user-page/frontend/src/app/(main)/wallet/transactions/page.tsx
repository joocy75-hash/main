'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, ChevronLeft, ChevronRight, ReceiptText, ArrowDownRight, ArrowUpRight, Search, ListFilter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn, formatAmount as formatAmountUtil } from '@/lib/utils';
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

const getDateRange = (period: PeriodFilter): { startDate?: string; endDate?: string } => {
  const now = new Date();
  const end = now.toISOString();
  switch (period) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { startDate: start.toISOString(), endDate: end };
    }
    case '7d': {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: end };
    }
    case '30d': {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate: start.toISOString(), endDate: end };
    }
    default:
      return {};
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '완료', className: 'bg-green-100 text-green-700' },
    rejected: { label: '거부', className: 'bg-red-100 text-red-700' },
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
      <span className="inline-flex items-center gap-1 rounded-md bg-[#f0fdf4] border border-[#bbf7d0] px-2 py-0.5 text-[11px] font-black text-[#16a34a] shadow-sm">
        <ArrowDownRight className="size-3" /> 입금/당첨
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-[#fef2f2] border border-[#fecaca] px-2 py-0.5 text-[11px] font-black text-[#ef4444] shadow-sm">
      <ArrowUpRight className="size-3" /> 출금/배팅
    </span>
  );
};

export default function TransactionsPage() {
  const {
    transactions,
    transactionsTotal,
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
      const dateRange = getDateRange(periodFilter);
      fetchTransactions({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        limit: PAGE_SIZE,
        ...dateRange,
      });
    },
    [typeFilter, statusFilter, periodFilter, fetchTransactions]
  );

  useEffect(() => {
    // Avoid synchronous cascading render
    setTimeout(() => {
      setCurrentPage(1);
    }, 0);
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
    const formatted = formatAmountUtil(tx.amount);
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
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Premium Header */}
      <div className="flex items-center justify-between rounded-2xl bg-white px-6 py-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e2e8f0]">
        <div className="flex items-center gap-4">
          <div className="relative flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-[inset_0_2px_0_rgba(255,255,255,0.8),_inset_0_-2px_0_rgba(226,232,240,0.5)] border border-[#e2e8f0] transform -rotate-2">
            <ReceiptText className="size-6 text-slate-700 drop-shadow-sm" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-[22px] font-black tracking-tight text-[#1e293b]">배팅 및 거래 내역</h1>
            <p className="text-[13px] font-bold text-[#94a3b8] mt-0.5">최근 이용하신 게임 배팅 및 입출금 상세 내역입니다.</p>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-[#e2e8f0] overflow-hidden">
        {/* Filters Top Bar */}
        <div className="flex flex-col gap-4 border-b border-[#e2e8f0] bg-gradient-to-b from-[#f8fafc] to-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Type Tabs */}
            <div className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-inner">
              {TYPE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setTypeFilter(tab.value)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-[13px] font-bold transition-all',
                    typeFilter === tab.value
                      ? 'bg-white text-[#1e293b] shadow-sm border border-slate-200/60'
                      : 'text-[#64748b] hover:text-[#334155]'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* Period Filter */}
              <Select
                value={periodFilter}
                onValueChange={(val) => setPeriodFilter(val as PeriodFilter)}
              >
                <SelectTrigger className="h-[42px] w-[110px] rounded-xl border-[#cbd5e1] bg-white text-[13px] font-bold text-[#334155] shadow-sm hover:border-slate-400 focus:ring-slate-200 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                  <SelectItem value="today" className="text-[13px] font-semibold text-slate-700">오늘</SelectItem>
                  <SelectItem value="7d" className="text-[13px] font-semibold text-slate-700">7일</SelectItem>
                  <SelectItem value="30d" className="text-[13px] font-semibold text-slate-700">30일</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-black text-slate-400 mr-1 flex items-center gap-1">
              <ListFilter className="size-3.5" /> 상태
            </span>
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.value}
                onClick={() => setStatusFilter(sf.value)}
                className={cn(
                  'rounded-lg border px-3 py-1.5 text-[12px] font-bold transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]',
                  statusFilter === sf.value
                    ? 'border-slate-800 bg-slate-800 text-white shadow-md'
                    : 'border-[#e2e8f0] bg-white text-[#64748b] hover:border-slate-300 hover:text-slate-700'
                )}
              >
                {sf.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table / List */}
        <div className="p-4 sm:p-5">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 shadow-inner">
                <Search className="size-8 text-slate-300" strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-bold text-slate-400">해당 조건의 이용 내역이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-hidden rounded-xl border border-[#e2e8f0] shadow-sm sm:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-slate-50">
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500">일시</th>
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500">유형</th>
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500">통화/수단</th>
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500 text-right">금액</th>
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500 text-center">TX Hash</th>
                      <th className="px-5 py-4 text-[13px] font-black tracking-wide text-slate-500 text-center">상태</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {transactions?.map((tx: Transaction) => (
                      <tr key={`${tx.type}-${tx.id}`} className="border-b border-[#e2e8f0] last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-[13px] font-semibold text-slate-500">
                          {formatDate(tx.createdAt)}
                        </td>
                        <td className="px-5 py-4">
                          <TypeBadge type={tx.type} />
                        </td>
                        <td className="px-5 py-4 text-[13px] font-black text-[#1e293b]">
                          {tx.coinType}
                        </td>
                        <td
                          className={cn(
                            'px-5 py-4 text-right text-[14px] font-black tracking-tight',
                            tx.type === 'deposit' ? 'text-green-600' : 'text-[#ef4444]'
                          )}
                        >
                          {formatAmount(tx)}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {tx.txHash ? (
                            <button
                              onClick={() => handleCopyHash(tx.txHash!)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 font-mono text-[12px] font-bold text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
                            >
                              {truncateHash(tx.txHash)}
                              {copiedHash === tx.txHash ? (
                                <Check className="size-3.5 text-green-600" />
                              ) : (
                                <Copy className="size-3.5" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[12px] font-bold text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-3 sm:hidden">
                {transactions?.map((tx: Transaction) => (
                  <div
                    key={`${tx.type}-${tx.id}`}
                    className="flex flex-col rounded-xl border border-[#e2e8f0] bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={tx.type} />
                        <span className="text-[14px] font-black text-[#1e293b]">{tx.coinType}</span>
                      </div>
                      <span
                        className={cn(
                          'text-[15px] font-black tracking-tight',
                          tx.type === 'deposit' ? 'text-green-600' : 'text-[#ef4444]'
                        )}
                      >
                        {formatAmount(tx)}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[12px] font-bold text-slate-400">
                        {formatDate(tx.createdAt)}
                      </span>
                      <StatusBadge status={tx.status} />
                    </div>
                    {tx.txHash && (
                      <div className="mt-2.5 pt-2.5 border-t border-dashed border-slate-200">
                        <button
                          onClick={() => handleCopyHash(tx.txHash!)}
                          className="inline-flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 font-mono text-[12px] font-bold text-slate-500 transition-colors active:bg-slate-100"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-slate-400">TX:</span> {truncateHash(tx.txHash)}
                          </span>
                          {copiedHash === tx.txHash ? (
                            <Check className="size-3.5 text-green-600" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="size-4.5" />
                  </button>

                  {getPageNumbers().map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={cn(
                        'inline-flex size-9 items-center justify-center rounded-xl text-[13px] font-black transition-all',
                        page === currentPage
                          ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white shadow-md border border-slate-800'
                          : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm'
                      )}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!transactionsHasMore && currentPage >= totalPages}
                    className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="size-4.5" />
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
