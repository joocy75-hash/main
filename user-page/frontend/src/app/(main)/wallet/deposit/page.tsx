'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
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
    pending: { label: '대기중', className: 'bg-yellow-50 text-yellow-600 border border-yellow-200' },
    approved: { label: '승인', className: 'bg-green-50 text-green-600 border border-green-200' },
    rejected: { label: '거부', className: 'bg-red-50 text-red-500 border border-red-200' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', v.className)}>
      {v.label}
    </span>
  );
};

export default function DepositPage() {
  const { deposits, fetchDeposits, createDeposit } = useWalletStore();

  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [amount, setAmount] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const network = DEFAULT_NETWORK[selectedCoin] || 'TRC20';
  const minAmount = MIN_DEPOSIT[selectedCoin] || 10;

  // Placeholder deposit address per coin
  const depositAddresses: Record<string, string> = {
    USDT: 'TRxJ8kF9d2G4hN5mP7qR3sT6vW8xY1zA29Fd8',
    TRX: 'TRxJ8kF9d2G4hN5mP7qR3sT6vW8xY1zA29Fd8',
    ETH: '0x742d35Cc6634C0532925a3b844Bc2e0e2930Fd8e',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    BNB: '0x742d35Cc6634C0532925a3b844Bc2e0e2930Fd8e',
  };

  const depositAddress = depositAddresses[selectedCoin] || '';

  useEffect(() => {
    fetchDeposits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(depositAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available
    }
  }, [depositAddress]);

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
      await createDeposit(selectedCoin, network, numAmount);
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
      {/* Deposit form card */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-[#dddddd] px-5 py-4">
          <h2 className="text-lg font-bold text-[#252531]">입금</h2>
        </div>
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Coin selection */}
          <div>
            <label className="mb-2 block text-sm text-[#707070]">
              코인 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {COINS.map((coin) => (
                <button
                  key={coin.type}
                  onClick={() => {
                    setSelectedCoin(coin.type);
                    setAmount('');
                    setError('');
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedCoin === coin.type
                      ? 'border-[#f4b53e] bg-[#fef8e8] text-[#f4b53e]'
                      : 'border-[#dddddd] bg-white text-[#707070] hover:bg-[#f8f9fc] hover:text-[#252531]'
                  )}
                >
                  <span className="text-base">{coin.icon}</span>
                  <span>{coin.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Network */}
          <div>
            <label className="mb-2 block text-sm text-[#707070]">
              네트워크
            </label>
            <div className="rounded-lg border border-[#dddddd] bg-[#f8f9fc] px-3 py-2.5 text-sm font-medium text-[#252531]">
              {network}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="mb-2 block text-sm text-[#707070]">
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
                className="w-full rounded-lg border border-[#dddddd] bg-white px-3 py-2.5 pr-16 text-sm text-[#252531] placeholder:text-[#aaaaaa] focus:border-[#f4b53e] focus:outline-none focus:ring-1 focus:ring-[#f4b53e]"
                min={0}
                step="any"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#707070]">
                {selectedCoin}
              </span>
            </div>
            <p className="mt-1 text-xs text-[#707070]">
              최소 입금액: {minAmount} {selectedCoin}
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-[#dddddd]" />

          {/* Deposit address */}
          <div>
            <label className="mb-2 block text-sm text-[#707070]">
              입금 주소
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-[#dddddd] bg-[#f8f9fc] px-3 py-2.5">
                <p className="truncate font-mono text-sm text-[#252531]">{depositAddress}</p>
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[#dddddd] bg-white px-3 py-2 text-sm font-medium text-[#252531] transition-colors hover:bg-[#f8f9fc]"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-green-500" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    복사
                  </>
                )}
              </button>
            </div>

            {/* QR code placeholder */}
            <div className="mt-3 flex justify-center">
              <div className="flex size-40 items-center justify-center rounded-lg border-2 border-dashed border-[#dddddd] bg-[#f8f9fc]">
                <div className="text-center">
                  <p className="text-xs text-[#707070]">QR Code</p>
                  <p className="mt-1 font-mono text-[10px] text-[#707070]">
                    {truncateHash(depositAddress)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning box */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <div className="text-sm">
                <p className="font-medium text-red-600">주의사항</p>
                <ul className="mt-1 flex flex-col gap-1 text-red-500">
                  <li>{network} 네트워크로만 전송하세요</li>
                  <li>다른 네트워크로 전송 시 자산을 잃을 수 있습니다</li>
                  <li>최소 입금액: {minAmount} {selectedCoin}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
            className={cn(
              'w-full rounded-lg px-4 py-3 text-sm font-bold text-white transition-opacity',
              'bg-gradient-to-b from-[#ffd651] to-[#fe960e]',
              (isSubmitting || !amount) ? 'cursor-not-allowed opacity-50' : 'hover:opacity-90'
            )}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                처리 중...
              </span>
            ) : (
              '입금 신청'
            )}
          </button>
        </div>
      </div>

      {/* Recent deposits card */}
      <div className="rounded-lg bg-white shadow-sm">
        <div className="border-b border-[#dddddd] px-5 py-4">
          <h2 className="text-base font-bold text-[#252531]">최근 입금 내역</h2>
        </div>
        <div className="px-5 py-4">
          {deposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-[#707070]">
                입금 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dddddd] bg-[#f8f9fc]">
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#707070]">일시</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#707070]">코인</th>
                      <th className="px-3 py-2.5 text-right text-xs font-medium text-[#707070]">금액</th>
                      <th className="px-3 py-2.5 text-left text-xs font-medium text-[#707070]">TX Hash</th>
                      <th className="px-3 py-2.5 text-center text-xs font-medium text-[#707070]">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deposits.slice(0, 5).map((d: Deposit) => (
                      <tr key={d.id} className="border-b border-[#dddddd] last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-[#707070]">
                          {formatDate(d.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#252531]">
                          {d.coinType}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-medium text-green-600">
                          +{parseFloat(d.amount).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[#707070]">
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
                {deposits.slice(0, 5).map((d: Deposit) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-[#dddddd] bg-[#f8f9fc] px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#252531]">{d.coinType}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <span className="text-xs text-[#707070]">
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
