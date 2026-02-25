'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEventStore } from '@/stores/event-store';
import { useWalletStore } from '@/stores/wallet-store';

const CONVERSION_RATE = 100; // 100P = 1 KRW
const MIN_CONVERT = 1000; // Minimum 1,000P

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
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-lg font-bold text-[#252531]">포인트</h2>
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#707070]">보유 포인트</p>
            <p className="text-2xl font-bold text-[#f4b53e]">
              {Number(points).toLocaleString('ko-KR')} P
            </p>
          </div>
        </div>
      </div>

      {/* Conversion card */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-bold text-[#252531]">
            포인트 전환 ({CONVERSION_RATE}P = 1원)
          </h2>
        </div>
        <div className="px-4 pb-4 flex flex-col gap-4">
          {/* Convert amount input */}
          <div>
            <label className="mb-2 block text-sm text-[#707070]">
              전환할 포인트
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder={`최소 ${MIN_CONVERT.toLocaleString('ko-KR')}`}
                value={convertAmount}
                onChange={(e) => {
                  setConvertAmount(e.target.value);
                  setError('');
                }}
                className="w-full h-10 px-3 pr-8 bg-white border border-[#dddddd] rounded-lg text-sm text-[#252531] placeholder:text-[#707070] focus:outline-none focus:ring-2 focus:ring-[#f4b53e]/40 focus:border-[#f4b53e]"
                min={0}
                step={100}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#707070]">
                P
              </span>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="flex flex-wrap gap-2">
            {[1000, 5000, 10000, 50000].map((amt) => (
              <button
                key={amt}
                onClick={() => setConvertAmount(String(amt))}
                className="px-3 py-1.5 text-xs font-medium border border-[#dddddd] rounded-lg bg-white text-[#252531] hover:bg-[#f8f9fc] transition-colors"
              >
                {amt.toLocaleString('ko-KR')}P
              </button>
            ))}
            <button
              onClick={() => setConvertAmount(points)}
              className="px-3 py-1.5 text-xs font-medium border border-[#dddddd] rounded-lg bg-white text-[#252531] hover:bg-[#f8f9fc] transition-colors"
            >
              전액
            </button>
          </div>

          <hr className="border-[#dddddd]" />

          {/* Receive amount */}
          <div className="flex items-center justify-between rounded-lg bg-[#f8f9fc] px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-[#707070]">
              <ArrowRightLeft className="size-4" />
              <span>받을 금액</span>
            </div>
            <span className="text-lg font-bold text-[#252531]">
              {cashAmount.toLocaleString('ko-KR')}원
            </span>
          </div>

          {/* Error/Success messages */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center text-sm font-medium text-green-600">
              {success}
            </div>
          )}

          {/* Convert button */}
          <button
            onClick={handleConvert}
            disabled={isConvertingPoints || !convertAmount || cashAmount <= 0}
            className="w-full h-11 rounded-lg bg-gradient-to-b from-[#ffd651] to-[#fe960e] text-white font-bold text-sm shadow-sm hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isConvertingPoints ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '전환하기'
            )}
          </button>
        </div>
      </div>

      {/* Point history */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-4 pt-4 pb-2">
          <h2 className="text-base font-bold text-[#252531]">포인트 내역</h2>
        </div>
        <div className="px-4 pb-4">
          {!pointHistory || pointHistory.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <span className="text-2xl">💎</span>
              <p className="text-sm text-[#707070]">
                포인트 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dddddd]">
                      <th className="text-left text-[#707070] text-xs uppercase font-medium bg-[#f8f9fc] px-3 py-2.5">일시</th>
                      <th className="text-left text-[#707070] text-xs uppercase font-medium bg-[#f8f9fc] px-3 py-2.5">유형</th>
                      <th className="text-right text-[#707070] text-xs uppercase font-medium bg-[#f8f9fc] px-3 py-2.5">금액</th>
                      <th className="text-right text-[#707070] text-xs uppercase font-medium bg-[#f8f9fc] px-3 py-2.5">잔여</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pointHistory.items.map((item) => {
                      const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-[#707070]' };
                      const isPositive = Number(item.amount) > 0;
                      return (
                        <tr key={item.id} className="border-b border-[#dddddd] last:border-b-0 hover:bg-[#f8f9fc] transition-colors">
                          <td className="px-3 py-2.5 text-xs text-[#707070]">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn('inline-block rounded-2xl bg-[#edeef3] px-2.5 py-0.5 text-xs font-medium', typeInfo.color)}>
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className={cn(
                            'px-3 py-2.5 text-right text-sm font-medium',
                            isPositive ? 'text-green-600' : 'text-red-500'
                          )}>
                            {isPositive ? '+' : ''}{Number(item.amount).toLocaleString('ko-KR')}
                          </td>
                          <td className="px-3 py-2.5 text-right text-sm text-[#707070]">
                            {Number(item.balance).toLocaleString('ko-KR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {pointHistory.items.map((item) => {
                  const typeInfo = TYPE_LABELS[item.type] || { label: item.type, color: 'text-[#707070]' };
                  const isPositive = Number(item.amount) > 0;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-[#dddddd] bg-[#f8f9fc] px-3 py-2.5"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={cn('inline-block rounded-2xl bg-[#edeef3] px-2.5 py-0.5 text-[10px] font-medium', typeInfo.color)}>
                            {typeInfo.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#707070]">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-sm font-semibold',
                          isPositive ? 'text-green-600' : 'text-red-500'
                        )}>
                          {isPositive ? '+' : ''}{Number(item.amount).toLocaleString('ko-KR')}P
                        </p>
                        <p className="text-[10px] text-[#707070]">
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
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium border border-[#dddddd] rounded-lg bg-white text-[#252531] hover:bg-[#f8f9fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    이전
                  </button>
                  <span className="text-xs text-[#707070]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 text-xs font-medium border border-[#dddddd] rounded-lg bg-white text-[#252531] hover:bg-[#f8f9fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음
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
