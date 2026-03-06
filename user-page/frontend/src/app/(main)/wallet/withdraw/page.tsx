'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { COINS, DEFAULT_NETWORK } from '@/lib/constants';
import { useWalletStore } from '@/stores/wallet-store';
import type { Transaction } from '@/stores/wallet-store';

const FEES: Record<string, number> = {
  'USDT/TRC20': 1,
  'USDT/ERC20': 5,
  'TRX/TRC20': 0,
  'ETH/ERC20': 0.001,
  'BTC/BTC': 0.0001,
  'BNB/BEP20': 0.005,
};

const DAILY_LIMITS: Record<string, number> = {
  USDT: 10000,
  TRX: 500000,
  ETH: 5,
  BTC: 0.5,
  BNB: 50,
};

const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { label: string; className: string }> = {
    pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-700' },
    approved: { label: '승인', className: 'bg-green-100 text-green-700' },
    rejected: { label: '거부', className: 'bg-red-100 text-red-700' },
  };
  const v = variants[status] || variants.pending;
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-xs font-medium', v.className)}>
      {v.label}
    </span>
  );
};

export default function WithdrawPage() {
  const {
    balance,
    addresses,
    withdrawals,
    fetchBalance,
    fetchAddresses,
    fetchWithdrawals,
    createWithdrawal,
  } = useWalletStore();

  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const network = DEFAULT_NETWORK[selectedCoin] || 'TRC20';
  const feeKey = `${selectedCoin}/${network}`;
  const fee = FEES[feeKey] ?? 0;
  const dailyLimit = DAILY_LIMITS[selectedCoin] || 10000;

  const numAmount = parseFloat(amount) || 0;
  const netAmount = Math.max(numAmount - fee, 0);

  const filteredAddresses = useMemo(
    () => addresses.filter((a) => a.coinType === selectedCoin),
    [addresses, selectedCoin]
  );

  const withdrawAddress = useMemo(() => {
    if (selectedAddressId === 'manual') return manualAddress;
    const found = addresses.find((a) => String(a.id) === selectedAddressId);
    return found?.address || '';
  }, [selectedAddressId, manualAddress, addresses]);

  const isFormValid = useMemo(() => {
    return (
      withdrawAddress.length > 0 &&
      numAmount > fee &&
      numAmount <= parseFloat(balance) &&
      password.length > 0
    );
  }, [withdrawAddress, numAmount, fee, balance, password]);

  useEffect(() => {
    fetchBalance();
    fetchAddresses();
    fetchWithdrawals();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedAddressId('');
    setManualAddress('');
    setAmount('');
    setError('');
  }, [selectedCoin]);

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!withdrawAddress) {
      setError('출금 주소를 입력하세요');
      return;
    }

    if (numAmount <= 0) {
      setError('유효한 금액을 입력하세요');
      return;
    }

    if (numAmount <= fee) {
      setError(`출금 금액이 수수료(${fee} ${selectedCoin})보다 커야 합니다`);
      return;
    }

    if (numAmount > parseFloat(balance)) {
      setError('잔액이 부족합니다');
      return;
    }

    if (numAmount > dailyLimit) {
      setError(`일일 출금 한도(${dailyLimit.toLocaleString('ko-KR')} ${selectedCoin})를 초과합니다`);
      return;
    }

    if (!password) {
      setError('비밀번호를 입력하세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawal(selectedCoin, network, withdrawAddress, numAmount, password);
      setAmount('');
      setPassword('');
      setSelectedAddressId('');
      setManualAddress('');
      await fetchWithdrawals();
      await fetchBalance();
    } catch (err) {
      setError(err instanceof Error ? err.message : '출금 신청에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    withdrawAddress, numAmount, fee, selectedCoin, balance, dailyLimit,
    password, network, createWithdrawal, fetchWithdrawals, fetchBalance,
  ]);

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
      {/* Withdraw form card */}
      <div className="rounded-lg bg-[#f5f5f7]">
        <div className="border-b border-[#e8e8e8] px-5 py-4">
          <h2 className="text-lg font-bold text-[#252531]">출금</h2>
        </div>
        <div className="flex flex-col gap-5 p-5">
          {/* Balance display */}
          <div className="flex items-center gap-3 rounded-lg border border-[#e8e8e8] bg-[#f8f8fa] px-4 py-3">
            <Wallet className="size-5 text-[#feb614]" />
            <div>
              <p className="text-xs text-[#6b7280]">보유 잔액</p>
              <p className="text-lg font-bold text-[#252531]">
                {parseFloat(balance).toLocaleString('ko-KR')}{' '}
                <span className="text-sm font-normal text-[#6b7280]">USDT</span>
              </p>
            </div>
          </div>

          {/* Coin selection */}
          <div>
            <label className="mb-2 block text-sm text-[#6b7280]">
              코인 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {COINS.map((coin) => (
                <button
                  key={coin.type}
                  onClick={() => setSelectedCoin(coin.type)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedCoin === coin.type
                      ? 'border-[#feb614] bg-[#fef9e7] text-[#feb614]'
                      : 'border-[#e8e8e8] bg-white text-[#6b7280] hover:bg-[#f8f8fa] hover:text-[#252531]'
                  )}
                >
                  <span className="text-base">{coin.icon}</span>
                  <span>{coin.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Withdraw address */}
          <div>
            <label className="mb-2 block text-sm text-[#6b7280]">
              출금 주소
            </label>
            <Select
              value={selectedAddressId}
              onValueChange={(val) => {
                setSelectedAddressId(val);
                if (val !== 'manual') setManualAddress('');
              }}
            >
              <SelectTrigger className="border-[#e8e8e8] bg-white">
                <SelectValue placeholder="출금 주소 선택" />
              </SelectTrigger>
              <SelectContent>
                {filteredAddresses.map((addr) => (
                  <SelectItem key={addr.id} value={String(addr.id)}>
                    {addr.label || addr.address.slice(0, 12) + '...'} ({addr.network})
                  </SelectItem>
                ))}
                <SelectItem value="manual">새 주소 입력</SelectItem>
              </SelectContent>
            </Select>

            {selectedAddressId === 'manual' && (
              <input
                className="mt-2 w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2.5 text-sm text-[#252531] placeholder:text-[#9ca3af] outline-none focus:border-[#feb614]"
                placeholder={`${selectedCoin} 주소 입력`}
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="mb-2 block text-sm text-[#6b7280]">
              출금 금액
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2.5 pr-16 text-sm text-[#252531] placeholder:text-[#9ca3af] outline-none focus:border-[#feb614]"
                min={0}
                step="any"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#6b7280]">
                {selectedCoin}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs text-[#6b7280]">
              <div className="flex justify-between">
                <span>수수료:</span>
                <span>{fee} {selectedCoin}</span>
              </div>
              <div className="flex justify-between">
                <span>실수령:</span>
                <span className="font-medium text-[#252531]">
                  {netAmount > 0 ? netAmount.toLocaleString('ko-KR') : '0'} {selectedCoin}
                </span>
              </div>
              <div className="flex justify-between">
                <span>일일 한도:</span>
                <span>{dailyLimit.toLocaleString('ko-KR')} {selectedCoin}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#e8e8e8]" />

          {/* Password */}
          <div>
            <label className="mb-2 block text-sm text-[#6b7280]">
              비밀번호 확인
            </label>
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-[#e8e8e8] bg-white px-3 py-2.5 text-sm text-[#252531] placeholder:text-[#9ca3af] outline-none focus:border-[#feb614]"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={cn(
              'flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-bold text-[#252531] transition-opacity',
              isSubmitting || !isFormValid
                ? 'cursor-not-allowed bg-[#e8e8e8] text-[#9ca3af]'
                : 'bg-gradient-to-b from-[#ffd651] to-[#fe960e] hover:opacity-90'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '출금 신청'
            )}
          </button>
        </div>
      </div>

      {/* Recent withdrawals card */}
      <div className="rounded-lg bg-[#f5f5f7]">
        <div className="border-b border-[#e8e8e8] px-5 py-4">
          <h2 className="text-base font-bold text-[#252531]">최근 출금 내역</h2>
        </div>
        <div className="p-5">
          {withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-[#6b7280]">
                출금 내역이 없습니다
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
                    {withdrawals.slice(0, 5).map((w: Transaction) => (
                      <tr key={w.id} className="border-b border-[#e8e8e8] last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-[#6b7280]">
                          {formatDate(w.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#252531]">
                          {w.coinType}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-medium text-red-500">
                          -{parseFloat(w.amount).toLocaleString('ko-KR')}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[#6b7280]">
                          {truncateHash(w.txHash || '')}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <StatusBadge status={w.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {withdrawals.slice(0, 5).map((w: Transaction) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-[#e8e8e8] bg-[#f8f8fa] px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#252531]">{w.coinType}</span>
                        <StatusBadge status={w.status} />
                      </div>
                      <span className="text-xs text-[#6b7280]">
                        {formatDate(w.createdAt)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-500">
                      -{parseFloat(w.amount).toLocaleString('ko-KR')}
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
