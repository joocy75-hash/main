'use client';

import { useEffect, useState } from 'react';
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
      <div className="bg-[#f5f5f7] rounded-lg px-5 py-4">
        <h2 className="text-lg font-bold text-[#252531]">머니내역</h2>
      </div>

      {/* Type filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setTypeFilter(f.value); setCurrentPage(1); }}
            className={cn(
              'shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-colors',
              typeFilter === f.value
                ? 'bg-[#feb614] text-[#252531]'
                : 'bg-[#e8e8e8] text-[#6b7280] hover:bg-[#f0f0f2]'
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
        ) : moneyLogs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12">
            <span className="text-4xl">💰</span>
            <p className="text-sm text-[#6b7280]">머니내역이 없습니다</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8f8fa]">
                  <th className="w-20 px-4 py-3 text-left text-[#6b7280] text-xs font-medium uppercase">유형</th>
                  <th className="px-4 py-3 text-left text-[#6b7280] text-xs font-medium uppercase">설명</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">금액</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">잔액</th>
                  <th className="px-4 py-3 text-right text-[#6b7280] text-xs font-medium uppercase">일시</th>
                </tr>
              </thead>
              <tbody>
                {moneyLogs.map((log) => {
                  const amount = Number(log.amount);
                  return (
                    <tr key={log.id} className="border-b border-[#e8e8e8] hover:bg-[#f0f0f2] transition-colors">
                      <td className="px-4 py-3">
                        <span className="bg-[#e8e8e8] text-[#6b7280] text-[10px] px-2 py-0.5 rounded-full">
                          {TYPE_LABEL[log.type] || log.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#252531]">{log.description}</td>
                      <td className={cn(
                        'px-4 py-3 text-right text-sm font-medium',
                        amount > 0 ? 'text-green-600' : 'text-red-500'
                      )}>
                        {formatAmount(log.amount)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-[#252531]">
                        {formatBalance(log.balanceAfter)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[#6b7280]">
                        {formatDateTime(log.createdAt)}
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
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className={cn(
              'border border-[#e8e8e8] text-[#6b7280] text-sm w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f0f2] transition-colors',
              currentPage <= 1 && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'text-sm w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  currentPage === page
                    ? 'bg-[#feb614] text-[#252531]'
                    : 'border border-[#e8e8e8] text-[#6b7280] hover:bg-[#f0f0f2]'
                )}
              >
                {page}
              </button>
            );
          })}
          <button
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className={cn(
              'border border-[#e8e8e8] text-[#6b7280] text-sm w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f0f2] transition-colors',
              currentPage >= totalPages && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
