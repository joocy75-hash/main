'use client';

import { useEffect, useState } from 'react';
import { cn, safeDecimal } from '@/lib/utils';
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

const RESULT_STYLE: Record<string, { label: string; className: string }> = {
  win: { label: '승리', className: 'bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full' },
  lose: { label: '패배', className: 'bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full' },
  draw: { label: '무승부', className: 'bg-[#e8e8e8] text-[#6b7280] text-xs px-2 py-0.5 rounded-full' },
  pending: { label: '대기', className: 'border border-[#e8e8e8] text-[#6b7280] text-xs px-2 py-0.5 rounded-full' },
};

const formatAmount = (value: string) =>
  new Intl.NumberFormat('ko-KR').format(safeDecimal(value).toNumber());

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
      <div className="bg-[#f5f5f7] rounded-lg px-5 py-4">
        <h2 className="text-lg font-bold text-[#252531]">베팅내역</h2>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCategory(f.value)}
            className={cn(
              'shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors',
              category === f.value
                ? 'bg-[#feb614] text-white'
                : 'bg-[#e8e8e8] text-[#6b7280] hover:bg-[#f0f0f2]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date filter */}
      <div className="flex gap-2">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={cn(
              'text-sm px-3 py-1 rounded-full transition-colors',
              dateFilter === f.value
                ? 'bg-[#feb614] text-white'
                : 'border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f0f0f2]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#f5f5f7] rounded-lg">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#e8e8e8] rounded h-12 w-full" />
            ))}
          </div>
        ) : bets.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl">📋</span>
            <p className="text-sm text-[#6b7280]">베팅내역이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f8fa]">
                  <th className="px-4 py-3 text-left text-[#6b7280] text-xs font-medium uppercase w-20">종목</th>
                  <th className="px-4 py-3 text-left text-[#6b7280] text-xs font-medium uppercase">게임</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">베팅액</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">당첨액</th>
                  <th className="px-4 py-3 text-center text-[#6b7280] text-xs font-medium uppercase">결과</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">일시</th>
                </tr>
              </thead>
              <tbody>
                {bets.map((bet) => {
                  const resultInfo = RESULT_STYLE[bet.result] || RESULT_STYLE.pending;
                  return (
                    <tr key={bet.id} className="border-b border-[#e8e8e8] hover:bg-[#f0f0f2] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#252531]">
                        {CATEGORY_FILTERS.find((c) => c.value === bet.gameCategory)?.label || bet.gameCategory}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#252531]">{bet.gameName}</td>
                      <td className="px-4 py-3 text-right text-sm text-[#252531]">{formatAmount(bet.betAmount)}</td>
                      <td className={cn(
                        'px-4 py-3 text-right text-sm text-[#252531]',
                        Number(bet.winAmount) > 0 && 'text-green-600'
                      )}>
                        {formatAmount(bet.winAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={resultInfo.className}>
                          {resultInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#6b7280]">
                        {formatDateTime(bet.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={betsPage <= 1}
            onClick={() => handlePageChange(betsPage - 1)}
            className={cn(
              'border border-[#e8e8e8] text-[#6b7280] text-sm px-3 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f0f2] transition-colors',
              betsPage <= 1 && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={cn(
                  'text-sm w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  betsPage === page
                    ? 'bg-[#feb614] text-white'
                    : 'border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f0f0f2]'
                )}
              >
                {page}
              </button>
            );
          })}
          <button
            disabled={!betsHasMore}
            onClick={() => handlePageChange(betsPage + 1)}
            className={cn(
              'border border-[#e8e8e8] text-[#6b7280] text-sm px-3 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f0f2] transition-colors',
              !betsHasMore && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
