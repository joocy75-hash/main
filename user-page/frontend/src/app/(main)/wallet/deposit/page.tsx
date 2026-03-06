'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COINS, DEFAULT_NETWORK } from '@/lib/constants';
import { useWalletStore } from '@/stores/wallet-store';
import type { Deposit } from '@/stores/wallet-store';

const MIN_DEPOSIT: Record<string, number> = {
  USDT: 10,
  TRX: 100,
  ETH: 0.01,
  BTC: 0.001,
  BNB: 0.1,
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: '대기중', className: 'bg-gradient-to-b from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-300 shadow-sm shadow-yellow-100/50' },
    approved: { label: '승인', className: 'bg-gradient-to-b from-green-50 to-green-100 text-green-700 border border-green-300 shadow-sm shadow-green-100/50' },
    rejected: { label: '거부', className: 'bg-gradient-to-b from-red-50 to-red-100 text-red-700 border border-red-300 shadow-sm shadow-red-100/50' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide', v.className)}>
      {v.label}
    </span>
  );
};

export default function DepositPage() {
  const { deposits, fetchDeposits, createDeposit } = useWalletStore();

  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastDeposit, setLastDeposit] = useState<Deposit | null>(null);
  const [copied, setCopied] = useState(false);

  const network = DEFAULT_NETWORK[selectedCoin] || 'TRC20';
  const minAmount = MIN_DEPOSIT[selectedCoin] || 10;

  useEffect(() => {
    fetchDeposits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    setError('');
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      setError('유효한 금액을 입력하세요');
      return;
    }

    if (numAmount < minAmount) {
      setError(`최소 입금액은 ${minAmount} ${selectedCoin} 입니다`);
      return;
    }

    setIsSubmitting(true);
    try {
      const deposit = await createDeposit(selectedCoin, network, numAmount);
      setLastDeposit(deposit);
      setAmount('');
      await fetchDeposits();
    } catch (err) {
      setError(err instanceof Error ? err.message : '입금 신청에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  }, [amount, minAmount, selectedCoin, network, createDeposit, fetchDeposits]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' });
  };

  const truncateHash = (hash: string) => {
    if (!hash) return '-';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Payment result card - shown after deposit creation */}
      {lastDeposit && (
        <div className="rounded-lg border-2 border-[#feb614] bg-[#fef9e7]">
          <div className="border-b border-[#feb614]/30 px-5 py-4">
            <h2 className="text-lg font-bold text-[#252531]">입금 요청 완료</h2>
          </div>
          <div className="flex flex-col gap-4 px-5 py-5">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280]">코인</span>
                <span className="text-sm font-medium text-[#252531]">{lastDeposit.coinType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280]">금액</span>
                <span className="text-sm font-medium text-[#252531]">{parseFloat(lastDeposit.amount).toLocaleString('ko-KR')} {lastDeposit.coinType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6b7280]">상태</span>
                <StatusBadge status={lastDeposit.status} />
              </div>
              {lastDeposit.depositAddress && (
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-[#6b7280]">입금 주소</span>
                  <div className="flex items-center gap-2">
                    <span className="flex-1 truncate font-mono text-xs text-[#252531]">{lastDeposit.depositAddress}</span>
                    <button
                      onClick={() => handleCopy(lastDeposit.depositAddress!)}
                      className="shrink-0 inline-flex items-center gap-1 rounded border border-[#e8e8e8] bg-white px-2 py-1 text-xs text-[#6b7280] hover:bg-[#f8f8fa]"
                    >
                      {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
                      {copied ? '복사됨' : '복사'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {lastDeposit.paymentUrl && (
              <a
                href={lastDeposit.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'w-full rounded-lg px-4 py-3 text-sm font-bold text-[#252531] transition-opacity text-center',
                  'bg-gradient-to-b from-[#ffd651] to-[#fe960e] hover:opacity-90',
                  'inline-flex items-center justify-center gap-2'
                )}
              >
                <ExternalLink className="size-4" />
                결제 페이지로 이동
              </a>
            )}

            <button
              onClick={() => setLastDeposit(null)}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-4 py-2.5 text-sm font-medium text-[#6b7280] hover:bg-[#f8f8fa]"
            >
              새 입금 신청
            </button>
          </div>
        </div>
      )}

      {/* Deposit form card - hidden when showing result */}
      {!lastDeposit && (
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
          <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
            <h2 className="text-lg font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2"><span className="text-xl">💳</span> 입금</h2>
          </div>
          <div className="flex flex-col gap-6 px-5 py-6 bg-[#fbfcfd]">
            {/* Coin selection */}
            <div>
              <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
                코인 선택
              </label>
              <div className="flex flex-wrap gap-2.5">
                {COINS.map((coin) => (
                  <button
                    key={coin.type}
                    onClick={() => {
                      setSelectedCoin(coin.type);
                      setAmount('');
                      setError('');
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-all relative overflow-hidden group',
                      selectedCoin === coin.type
                        ? 'border-transparent bg-gradient-to-b from-[#ffd651] to-[#f59e0b] text-white shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_2px_4px_rgba(255,255,255,0.4),_0_4px_6px_rgba(245,158,11,0.3)] transform -translate-y-0.5'
                        : 'border-[#e2e8f0] bg-gradient-to-b from-white to-[#f8fafc] text-[#64748b] hover:to-[#f1f5f9] hover:text-[#1e293b] shadow-[inset_0_-2px_0_rgba(0,0,0,0.05),_0_2px_4px_rgba(0,0,0,0.02)]'
                    )}
                  >
                    <div className={cn(
                      "size-8 rounded-full flex items-center justify-center text-lg shadow-sm bg-white transition-transform group-hover:scale-110 p-1",
                      selectedCoin === coin.type ? "text-[#f59e0b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] ring-1 ring-[#f59e0b]/20" : "text-gray-500 ring-1 ring-gray-100"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={('iconUrl' in coin ? (coin as Record<string, string>).iconUrl : undefined)} alt={coin.name} className="w-full h-full object-contain" />
                    </div>
                    <span className="pr-1 drop-shadow-sm">{coin.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Network */}
            <div>
              <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
                네트워크
              </label>
              <div className="rounded-xl border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-3 text-[15px] font-black text-[#334155] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                {network}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
                입금 금액
              </label>
              <div className="relative">
                <input
                  type="number"
                  placeholder={`최소 ${minAmount}`}
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError('');
                  }}
                  className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3.5 pr-16 text-[15px] font-black text-[#1e293b] placeholder:text-[#9ca3af] placeholder:font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all"
                  min={0}
                  step="any"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#94a3b8]">
                  {selectedCoin}
                </span>
              </div>
              <p className="mt-2 text-xs font-bold text-[#64748b]">
                최소 입금액: {minAmount} {selectedCoin}
              </p>
            </div>

            {/* Warning box */}
            <div className="rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-red-50/50 p-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-red-400"></div>
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-red-500 drop-shadow-sm" />
                <div className="text-[13px]">
                  <p className="font-extrabold text-red-700">주의사항</p>
                  <ul className="mt-1.5 flex flex-col gap-1 text-red-600 font-medium">
                    <li>• {network} 네트워크로만 전송하세요</li>
                    <li>• 다른 네트워크로 전송 시 자산을 잃을 수 있습니다</li>
                    <li>• 최소 입금액: {minAmount} {selectedCoin}</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[13px] font-bold text-red-500 animate-pulse">{error}</p>
            )}

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount}
              className={cn(
                'w-full rounded-xl px-4 py-3.5 text-[16px] font-black text-white h-[54px] transition-all flex items-center justify-center gap-2 mt-2',
                (isSubmitting || !amount) 
                  ? 'bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-[#94a3b8] cursor-not-allowed shadow-none border border-[#cbd5e1]' 
                  : 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_6px_10px_rgba(245,158,11,0.3)] hover:translate-y-[1px] hover:shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_4px_8px_rgba(245,158,11,0.3)]'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-5 animate-spin drop-shadow-sm" />
                  처리 중...
                </>
              ) : (
                '입금 신청'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent deposits card */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden mt-2">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h2 className="text-[15px] font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
            <span className="text-[18px]">🧾</span> 최근 입금 내역
          </h2>
        </div>
        <div className="px-5 py-4">
          {(deposits || []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-[#6b7280]">
                입금 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#e8e8e8] bg-[#f8f8fa]">
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6b7280]">일시</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6b7280]">코인</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-[#6b7280]">금액</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#6b7280]">TX Hash</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-[#6b7280]">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(deposits || []).slice(0, 5).map((d: Deposit) => (
                      <tr key={d.id} className="border-b border-[#e8e8e8] last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-[#6b7280]">
                          {formatDate(d.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#252531]">
                          {d.coinType}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-medium text-green-600">
                          +{parseFloat(d.amount).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[#6b7280]">
                          {truncateHash(d.txHash || '')}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={d.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {(deposits || []).slice(0, 5).map((d: Deposit) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-[#e8e8e8] bg-[#f8f8fa] px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#252531]">{d.coinType}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <span className="text-xs text-[#6b7280]">
                        {formatDate(d.createdAt)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-600">
                      +{parseFloat(d.amount).toLocaleString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
