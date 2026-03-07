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
import { cn, safeDecimal, formatAmount } from '@/lib/utils';
import Decimal from 'decimal.js';
import { COINS, DEFAULT_NETWORK, validateAddress } from '@/lib/constants';
import { useWalletStore } from '@/stores/wallet-store';
import { useProfileStore } from '@/stores/profile-store';
import type { Transaction } from '@/stores/wallet-store';

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

export default function WithdrawPage() {
  const {
    balance,
    addresses,
    withdrawals,
    withdrawConfig,
    fetchBalance,
    fetchAddresses,
    fetchWithdrawals,
    fetchWithdrawConfig,
    createWithdrawal,
  } = useWalletStore();

  const { profile, fetchProfile } = useProfileStore();

  const [selectedCoin, setSelectedCoin] = useState('USDT');
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [manualAddress, setManualAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const network = DEFAULT_NETWORK[selectedCoin] || 'TRC20';
  const fees = withdrawConfig?.fees ?? {};
  const dailyLimits = withdrawConfig?.dailyLimits ?? {};
  const fee = safeDecimal(fees[`${selectedCoin}/${network}`]);
  const dailyLimit = safeDecimal(dailyLimits[selectedCoin]);

  const decAmount = safeDecimal(amount);
  const netAmount = Decimal.max(decAmount.minus(fee), new Decimal(0));

  const filteredAddresses = useMemo(
    () => (addresses || []).filter((a) => a.coinType === selectedCoin),
    [addresses, selectedCoin]
  );

  const withdrawAddress = useMemo(() => {
    if (selectedAddressId === 'manual') return manualAddress;
    const found = (addresses || []).find((a) => String(a.id) === selectedAddressId);
    return found?.address || '';
  }, [selectedAddressId, manualAddress, addresses]);

  const addressValidation = useMemo(() => {
    if (!withdrawAddress) return { valid: true };
    return validateAddress(network, withdrawAddress);
  }, [network, withdrawAddress]);

  const isFormValid = useMemo(() => {
    const pinOk = !profile?.hasWithdrawPin || /^\d{6}$/.test(withdrawPin);
    return (
      withdrawAddress.length > 0 &&
      addressValidation.valid &&
      decAmount.gt(fee) &&
      decAmount.lte(safeDecimal(balance)) &&
      password.length > 0 &&
      pinOk
    );
  }, [withdrawAddress, addressValidation.valid, amount, balance, password, withdrawPin, profile?.hasWithdrawPin, withdrawConfig, selectedCoin]);

  useEffect(() => {
    fetchBalance();
    fetchAddresses();
    fetchWithdrawals();
    fetchWithdrawConfig();
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedAddressId('');
    setManualAddress('');
    setAmount('');
    setWithdrawPin('');
    setError('');
  }, [selectedCoin]);

  const handleSubmit = useCallback(async () => {
    setError('');

    if (!withdrawAddress) {
      setError('출금 주소를 입력하세요');
      return;
    }

    if (decAmount.lte(0)) {
      setError('유효한 금액을 입력하세요');
      return;
    }

    if (decAmount.lte(fee)) {
      setError(`출금 금액이 수수료(${fee} ${selectedCoin})보다 커야 합니다`);
      return;
    }

    if (decAmount.gt(safeDecimal(balance))) {
      setError('잔액이 부족합니다');
      return;
    }

    if (decAmount.gt(dailyLimit)) {
      setError(`일일 출금 한도(${formatAmount(dailyLimit.toString())} ${selectedCoin})를 초과합니다`);
      return;
    }

    if (!password) {
      setError('비밀번호를 입력하세요');
      return;
    }

    setIsSubmitting(true);
    try {
      await createWithdrawal(selectedCoin, network, withdrawAddress, decAmount.toNumber(), password, withdrawPin);
      setAmount('');
      setPassword('');
      setWithdrawPin('');
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
    withdrawAddress, amount, selectedCoin, balance, withdrawConfig,
    password, withdrawPin, network, createWithdrawal, fetchWithdrawals, fetchBalance,
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
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h2 className="text-lg font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2"><span className="text-xl">💳</span> 출금</h2>
        </div>
        <div className="flex flex-col gap-6 px-5 py-6 bg-[#fbfcfd]">
          {/* Balance display */}
          <div className="flex items-center gap-3.5 rounded-xl border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-4 py-4 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
            <div className="size-10 rounded-full bg-gradient-to-br from-white to-[#fef3c7] border border-[#fde68a] flex items-center justify-center shadow-sm">
              <Wallet className="size-5 text-[#f59e0b] drop-shadow-sm" />
            </div>
            <div>
              <p className="text-[12px] font-extrabold text-[#64748b] mb-0.5">보유 잔액</p>
              <p className="text-[18px] font-black text-[#1e293b] flex items-baseline gap-1">
                {formatAmount(balance)}
                <span className="text-[13px] font-bold text-[#94a3b8]">USDT</span>
              </p>
            </div>
          </div>

          {/* Coin selection */}
          <div>
            <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
              코인 선택
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COINS.map((coin) => (
                <button
                  key={coin.type}
                  onClick={() => setSelectedCoin(coin.type)}
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

          {/* Withdraw address */}
          <div>
            <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
              출금 주소
            </label>
            <Select
              value={selectedAddressId}
              onValueChange={(val) => {
                setSelectedAddressId(val);
                if (val !== 'manual') setManualAddress('');
              }}
            >
              <SelectTrigger className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 h-[50px] text-[14px] font-bold text-[#1e293b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:ring-2 focus:ring-[#f59e0b]">
                <SelectValue placeholder="출금 주소 선택" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#cbd5e1] shadow-lg">
                {filteredAddresses.map((addr) => (
                  <SelectItem key={addr.id} value={String(addr.id)} className="font-medium">
                    {addr.label || addr.address.slice(0, 12) + '...'} <span className="text-[#94a3b8] ml-1">({addr.network})</span>
                  </SelectItem>
                ))}
                <SelectItem value="manual" className="font-extrabold text-[#f59e0b]">새 주소 입력</SelectItem>
              </SelectContent>
            </Select>

            {selectedAddressId === 'manual' && (
              <>
                <input
                  className="mt-3 w-full rounded-xl border border-[#f59e0b] bg-yellow-50/30 px-4 py-3.5 text-[14px] font-mono text-[#1e293b] placeholder:text-[#9ca3af] placeholder:font-sans shadow-[inset_0_2px_4px_rgba(245,158,11,0.05)] focus:border-[#f59e0b] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
                  placeholder={`${selectedCoin} 주소 입력`}
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
                {!addressValidation.valid && (
                  <p className="mt-1 text-[12px] text-red-500">{addressValidation.message}</p>
                )}
              </>
            )}
          </div>

          {/* Amount input */}
          <div>
            <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
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
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3.5 pr-16 text-[15px] font-black text-[#1e293b] placeholder:text-[#9ca3af] placeholder:font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all"
                min={0}
                step="any"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-[#94a3b8]">
                {selectedCoin}
              </span>
            </div>
            
            <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-[#e2e8f0] bg-white p-3.5 shadow-sm">
              <div className="flex justify-between items-center text-[12px] font-extrabold text-[#64748b]">
                <span>수수료</span>
                <span className="text-[#475569] bg-[#f1f5f9] px-2 py-0.5 rounded">{fee.toString()} {selectedCoin}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-extrabold text-[#64748b] pt-1.5 border-t border-[#f1f5f9] border-dashed">
                <span>실수령 금액</span>
                <span className="text-[16px] font-black text-[#10b981]">
                  {netAmount.gt(0) ? formatAmount(netAmount.toString()) : '0'} <span className="text-[13px] font-bold opacity-80">{selectedCoin}</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-[#94a3b8] mt-1">
                <span>일일 한도: {formatAmount(dailyLimit.toString())}</span>
                <span>{selectedCoin}</span>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
              비밀번호 확인
            </label>
            <input
              type="password"
              placeholder="보안 비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3.5 text-[15px] font-black text-[#1e293b] placeholder:text-[#9ca3af] placeholder:font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all"
            />
          </div>

          {/* Withdraw PIN (if set) */}
          {profile?.hasWithdrawPin && (
            <div>
              <label className="mb-2.5 block text-[13px] font-extrabold text-[#64748b]">
                출금 PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                placeholder="6자리 출금 PIN을 입력하세요"
                value={withdrawPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setWithdrawPin(val);
                  setError('');
                }}
                className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3.5 text-[15px] font-black text-[#1e293b] placeholder:text-[#9ca3af] placeholder:font-medium shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#f59e0b] transition-all tracking-[0.3em] text-center"
              />
              <p className="mt-1.5 text-[11px] text-[#94a3b8]">프로필에서 설정한 6자리 출금 PIN</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-[13px] font-bold text-red-500 animate-pulse">{error}</p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className={cn(
              'w-full rounded-xl px-4 py-3.5 text-[16px] font-black text-white h-[54px] transition-all flex items-center justify-center gap-2 mt-2',
              (isSubmitting || !isFormValid)
                ? 'bg-gradient-to-b from-[#e2e8f0] to-[#cbd5e1] text-[#94a3b8] cursor-not-allowed shadow-none border border-[#cbd5e1]'
                : 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_6px_10px_rgba(245,158,11,0.3)] hover:translate-y-[1px] hover:shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_inset_0_3px_5px_rgba(255,255,255,0.4),_0_4px_8px_rgba(245,158,11,0.3)]'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-5 animate-spin drop-shadow-sm" />
                처리 중...
              </>
            ) : (
              '출금 신청'
            )}
          </button>
        </div>
      </div>

      {/* Recent withdrawals card */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden mt-2">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h2 className="text-[15px] font-black text-[#1e293b] drop-shadow-sm flex items-center gap-2">
            <span className="text-[18px]">🧾</span> 최근 출금 내역
          </h2>
        </div>
        <div className="p-5">
          {(withdrawals || []).length === 0 ? (
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
                    {(withdrawals || []).slice(0, 5).map((w: Transaction) => (
                      <tr key={w.id} className="border-b border-[#e8e8e8] last:border-b-0">
                        <td className="px-3 py-2.5 text-sm text-[#6b7280]">
                          {formatDate(w.createdAt)}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#252531]">
                          {w.coinType}
                        </td>
                        <td className="px-3 py-2.5 text-right text-sm font-medium text-red-500">
                          -{formatAmount(w.amount)}
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
                {(withdrawals || []).slice(0, 5).map((w: Transaction) => (
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
                      -{formatAmount(w.amount)}
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
