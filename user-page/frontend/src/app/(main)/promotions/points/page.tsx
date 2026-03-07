'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { cn, safeDecimal, formatAmount } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';
import { useWalletStore } from '@/stores/wallet-store';

const CONVERSION_RATE = 100; // 100P = 1원
const MIN_CONVERT = 1000000; // Minimum 1,000,000P = 10,000원

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  attendance: { label: '출석', color: 'text-green-600' },
  mission: { label: '미션', color: 'text-blue-600' },
  spin: { label: '스핀', color: 'text-purple-600' },
  convert: { label: '전환', color: 'text-yellow-600' },
  admin_credit: { label: '지급', color: 'text-green-600' },
  admin_debit: { label: '차감', color: 'text-red-600' },
  payback: { label: '페이백', color: 'text-cyan-600' },
  promotion: { label: '프로모션', color: 'text-orange-600' },
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
    ? safeDecimal(convertAmount).div(CONVERSION_RATE).floor().toNumber()
    : 0;

  const handleConvert = useCallback(async () => {
    setError('');
    setSuccess('');

    const decAmt = safeDecimal(convertAmount);
    if (!convertAmount || decAmt.lte(0)) {
      setError('유효한 금액을 입력하세요');
      return;
    }
    if (decAmt.lt(MIN_CONVERT)) {
      setError(`최소 전환 포인트는 ${MIN_CONVERT.toLocaleString('ko-KR')}P (1만원) 입니다`);
      return;
    }
    if (decAmt.gt(safeDecimal(points))) {
      setError('보유 포인트가 부족합니다');
      return;
    }

    try {
      const result = await convertPoints(decAmt.toNumber());
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
    <div className="flex flex-col gap-5">
      {/* 3D Balance card */}
      <div className="relative rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 p-5 shadow-[0_6px_16px_rgba(16,185,129,0.3),_inset_0_2px_4px_rgba(255,255,255,0.4)] overflow-hidden">
        {/* Gloss Overlay */}
        <div className="absolute inset-x-0 top-0 h-[40%] bg-white/20 pointer-events-none rounded-t-2xl"></div>
        {/* Decorative circle */}
        <div className="absolute top-[-20%] right-[-5%] w-[120px] h-[120px] rounded-full bg-white/10 blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-[14px] font-black text-white/90 drop-shadow-sm tracking-tight">보유 포인트</h2>
            <div className="flex items-baseline gap-1.5 mt-1">
              <p className="text-[32px] font-black text-white drop-shadow-md tracking-tighter">
                {formatAmount(points)}
              </p>
              <span className="text-[18px] font-bold text-white/80">P</span>
            </div>
          </div>
          <div className="relative flex size-[54px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#fbbf24] to-[#f59e0b] shadow-[0_4px_10px_rgba(0,0,0,0.2),_inset_0_2px_0_rgba(255,255,255,0.4),_inset_0_-3px_0_rgba(217,119,6,0.8)] border border-[#fef08a] transform rotate-12 hover:rotate-0 transition-transform duration-300">
            <span className="text-[26px] font-black text-white drop-shadow-[0_2px_2px_rgba(217,119,6,0.8)] pr-0.5 mt-0.5">P</span>
          </div>
        </div>
      </div>

      {/* 3D Conversion card */}
      <div className="rounded-[16px] bg-white border border-[#e5e9f0] shadow-sm overflow-hidden flex flex-col relative z-0">
        <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-5 py-3.5 border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white] flex items-center gap-2.5">
          <div className="relative flex size-6 items-center justify-center rounded-md bg-gradient-to-b from-[#feb614] to-[#f59e0b] shadow-sm">
            <ArrowRightLeft className="size-3.5 text-white drop-shadow-sm" strokeWidth={3} />
          </div>
          <h2 className="text-[15px] font-black text-[#1e293b] tracking-tight">
            포인트 전환 <span className="text-[#94a3b8] font-bold text-[12px] ml-1">({CONVERSION_RATE}P = 1원)</span>
          </h2>
        </div>
        
        <div className="p-5 flex flex-col gap-5 bg-[#fbfcfd]">
          {/* Convert amount input */}
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-extrabold text-[#64748b] tracking-tight ml-0.5">
              전환할 포인트 입력
            </label>
            <div className="relative group">
              <input
                type="number"
                placeholder={`최소 ${MIN_CONVERT.toLocaleString('ko-KR')} P`}
                value={convertAmount}
                onChange={(e) => {
                  setConvertAmount(e.target.value);
                  setError('');
                }}
                className="w-full h-[46px] px-4 pr-10 bg-white border border-[#cbd5e1] rounded-xl text-[16px] font-black text-[#1e293b] placeholder:text-[#94a3b8] placeholder:font-bold focus:outline-none focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
                min={0}
                step={100}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[15px] font-black text-[#94a3b8] group-focus-within:text-[#3b82f6] transition-colors">
                P
              </span>
            </div>
          </div>

          {/* Quick amount HTML buttons - 3D styled */}
          <div className="grid grid-cols-5 gap-2">
            {[1000000, 5000000, 10000000, 50000000].map((amt) => (
              <button
                key={amt}
                onClick={() => setConvertAmount(String(amt))}
                className="h-[36px] flex items-center justify-center text-[12px] font-black rounded-lg bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] text-[#475569] shadow-[0_2px_4px_rgba(0,0,0,0.03),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:border-[#cbd5e1] hover:-translate-y-0.5 transition-all"
              >
                {(amt / CONVERSION_RATE / 10000)}만원
              </button>
            ))}
            <button
              onClick={() => setConvertAmount(points.toString())}
              className="h-[36px] flex items-center justify-center text-[12px] font-black rounded-lg bg-gradient-to-b from-[#64748b] to-[#475569] border-none text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.3),_inset_0_2px_2px_rgba(255,255,255,0.2),_0_2px_4px_rgba(0,0,0,0.15)] hover:from-[#475569] hover:to-[#334155] hover:-translate-y-0.5 transition-all"
            >
              전액
            </button>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent my-1"></div>

          {/* Receive amount Box */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/50 px-5 py-4 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-l-xl"></div>
            <div className="flex items-center gap-2.5">
              <span className="flex size-[28px] items-center justify-center rounded-full bg-white shadow-sm border border-blue-100">
                <ArrowRightLeft className="size-3.5 text-blue-500" />
              </span>
              <span className="text-[13px] font-extrabold text-[#64748b]">전환 시 받을 금액</span>
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[20px] font-black text-[#3b82f6] tracking-tight">
                {cashAmount > 0 ? cashAmount.toLocaleString('ko-KR') : '0'}
              </span>
              <span className="text-[14px] font-bold text-[#64748b]">원</span>
            </div>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-2.5 text-center text-[13px] font-bold text-[#ef4444] shadow-sm animate-in fade-in zoom-in duration-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2.5 text-center text-[13px] font-bold text-[#16a34a] shadow-sm animate-in fade-in zoom-in duration-200">
              {success}
            </div>
          )}

          {/* Convert button - 3D Volume */}
          <button
            onClick={handleConvert}
            disabled={isConvertingPoints || !convertAmount || cashAmount <= 0}
            className="group relative w-full h-[54px] rounded-xl overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none hover:-translate-y-[1px] active:translate-y-[1px] transition-all shadow-[0_4px_12px_rgba(245,158,11,0.3)] mt-2"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#fcd34d] via-[#f59e0b] to-[#d97706]"></div>
            <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-white/40 to-transparent"></div>
            <div className="absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-black/20 to-transparent"></div>
            <div className="absolute inset-0 ring-1 ring-inset ring-white/30 rounded-xl"></div>
            <div className="relative flex h-full items-center justify-center text-[16px] font-black text-white drop-shadow-md">
              {isConvertingPoints ? (
                <>
                  <Loader2 className="mr-2 size-5 animate-spin" strokeWidth={3} />
                  처리 중...
                </>
              ) : (
                '포인트 전환하기'
              )}
            </div>
          </button>
        </div>
      </div>

      {/* 3D Point history Table/Panel */}
      <div className="rounded-[16px] bg-white border border-[#e5e9f0] shadow-sm overflow-hidden flex flex-col h-fit mb-4">
        <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-5 py-3 border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white] flex items-center gap-2">
          <div className="w-1.5 h-4 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <h2 className="text-[15px] font-black text-[#1e293b] tracking-tight">포인트 내역</h2>
        </div>
        <div className="flex flex-col">
          {!pointHistory || pointHistory.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center bg-[#fbfcfd]">
              <div className="relative flex size-[54px] items-center justify-center rounded-full bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1] shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_2px_0_rgba(255,255,255,0.6),_inset_0_-3px_0_rgba(148,163,184,0.5)] border border-white mb-2">
                <span className="text-[26px] font-black text-white drop-shadow-[0_2px_2px_rgba(148,163,184,0.5)] pr-0.5 mt-0.5">P</span>
              </div>
              <p className="text-[13px] font-bold text-[#94a3b8]">
                포인트 적립/사용 내역이 없습니다.
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto bg-white">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      <th className="text-left text-[#64748b] text-[12px] font-extrabold px-5 py-3">일시</th>
                      <th className="text-left text-[#64748b] text-[12px] font-extrabold px-5 py-3">분류</th>
                      <th className="text-right text-[#64748b] text-[12px] font-extrabold px-5 py-3">포인트 증감</th>
                      <th className="text-right text-[#64748b] text-[12px] font-extrabold px-5 py-3">잔여 포인트</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0]">
                    {pointHistory.items.map((item) => {
                      const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-[#64748b]' };
                      const isPositive = safeDecimal(item.amount).gt(0);
                      return (
                        <tr key={item.id} className="hover:bg-[#f8fafc] transition-colors">
                          <td className="px-5 py-3 text-[13px] font-bold text-[#64748b] tracking-tight">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-5 py-3">
                            <span className={cn('inline-flex items-center rounded-md bg-white border px-2 py-0.5 text-[11px] font-black shadow-sm tracking-tight', 
                              typeInfo.color === 'text-green-600' ? 'border-green-200 text-green-700' :
                              typeInfo.color === 'text-blue-600' ? 'border-blue-200 text-blue-700' :
                              typeInfo.color === 'text-purple-600' ? 'border-purple-200 text-purple-700' :
                              typeInfo.color === 'text-yellow-600' ? 'border-amber-200 text-amber-700' :
                              typeInfo.color === 'text-red-600' ? 'border-red-200 text-red-700' :
                              'border-[#e2e8f0] text-[#64748b]')}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className={cn(
                            'px-5 py-3 text-right text-[14px] font-black tracking-tight',
                            isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'
                          )}>
                            {isPositive ? '+' : ''}{formatAmount(item.amount)}
                          </td>
                          <td className="px-5 py-3 text-right text-[13px] font-black text-[#1e293b]">
                            {formatAmount(item.balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2.5 sm:hidden p-3 bg-[#fbfcfd]">
                {pointHistory.items.map((item) => {
                  const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-[#64748b]' };
                  const isPositive = Number(item.amount) > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-[#e2e8f0] bg-gradient-to-b from-white to-[#f8fafc] px-4 py-3.5 shadow-sm"
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('inline-flex items-center rounded-md bg-white border px-2 py-0.5 text-[10px] font-black shadow-sm tracking-tight', 
                              typeInfo.color === 'text-green-600' ? 'border-green-200 text-green-700' :
                              typeInfo.color === 'text-blue-600' ? 'border-blue-200 text-blue-700' :
                              typeInfo.color === 'text-purple-600' ? 'border-purple-200 text-purple-700' :
                              typeInfo.color === 'text-yellow-600' ? 'border-amber-200 text-amber-700' :
                              typeInfo.color === 'text-red-600' ? 'border-red-200 text-red-700' :
                              'border-[#e2e8f0] text-[#64748b]')}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-[#94a3b8] tracking-tight">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className={cn(
                          'text-[15px] font-black tracking-tight',
                          isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'
                        )}>
                          {isPositive ? '+' : ''}{formatAmount(item.amount)} <span className="text-[11px] font-bold opacity-80">P</span>
                        </p>
                        <p className="text-[11px] font-extrabold text-[#64748b] bg-[#e2e8f0]/50 px-1.5 py-0.5 rounded">
                          잔여 {formatAmount(item.balance)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 3D Pagination */}
              {totalPages > 1 && (
                <div className="mt-2 mb-4 flex items-center justify-center gap-2 bg-transparent pb-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] shadow-[0_2px_4px_rgba(0,0,0,0.03),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="text-[10px] font-black">이전</span>
                  </button>
                  <span className="text-[12px] font-black text-[#1e293b] bg-[#f8fafc] px-3 py-1.5 rounded-md border border-[#e2e8f0] shadow-inner">
                    {currentPage} <span className="text-[#94a3b8] mx-1">/</span> {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] text-[#64748b] shadow-[0_2px_4px_rgba(0,0,0,0.03),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.02)] hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <span className="text-[10px] font-black">다음</span>
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
