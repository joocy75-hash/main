'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { COINS, DEFAULT_NETWORK } from '@/lib/constants';
import { useWalletStore } from '@/stores/wallet-store';
import type { Withdrawal } from '@/stores/wallet-store';

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
    pending: { label: '대기중', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    approved: { label: '승인', className: 'bg-green-500/20 text-green-400 border-green-500/30' },
    rejected: { label: '거부', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const v = variants[status] || variants.pending;
  return (
    <Badge variant="outline" className={v.className}>
      {v.label}
    </Badge>
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

  // Reset address selection when coin changes
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">출금</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Balance display */}
          <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
            <Wallet className="size-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">보유 잔액</p>
              <p className="text-lg font-bold">
                {parseFloat(balance).toLocaleString('ko-KR')}{' '}
                <span className="text-sm font-normal text-muted-foreground">USDT</span>
              </p>
            </div>
          </div>

          {/* Coin selection */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              코인 선택
            </Label>
            <div className="flex flex-wrap gap-2">
              {COINS.map((coin) => (
                <button
                  key={coin.type}
                  onClick={() => setSelectedCoin(coin.type)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedCoin === coin.type
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
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
            <Label className="mb-2 block text-sm text-muted-foreground">
              출금 주소
            </Label>
            <Select
              value={selectedAddressId}
              onValueChange={(val) => {
                setSelectedAddressId(val);
                if (val !== 'manual') setManualAddress('');
              }}
            >
              <SelectTrigger className="bg-card">
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
              <Input
                className="mt-2 bg-card"
                placeholder={`${selectedCoin} 주소 입력`}
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            )}
          </div>

          {/* Amount input */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              출금 금액
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                className="bg-card pr-16"
                min={0}
                step="any"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {selectedCoin}
              </span>
            </div>
            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>수수료:</span>
                <span>{fee} {selectedCoin}</span>
              </div>
              <div className="flex justify-between">
                <span>실수령:</span>
                <span className="font-medium text-foreground">
                  {netAmount > 0 ? netAmount.toLocaleString('ko-KR') : '0'} {selectedCoin}
                </span>
              </div>
              <div className="flex justify-between">
                <span>일일 한도:</span>
                <span>{dailyLimit.toLocaleString('ko-KR')} {selectedCoin}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Password */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              비밀번호 확인
            </Label>
            <Input
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="bg-card"
            />
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit button */}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !isFormValid}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '출금 신청'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 출금 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                출금 내역이 없습니다
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>일시</TableHead>
                      <TableHead>코인</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                      <TableHead>TX Hash</TableHead>
                      <TableHead className="text-center">상태</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals.slice(0, 5).map((w: Withdrawal) => (
                      <TableRow key={w.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(w.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {w.coinType}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-red-400">
                          -{parseFloat(w.amount).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {truncateHash(w.txHash || '')}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={w.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {withdrawals.slice(0, 5).map((w: Withdrawal) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{w.coinType}</span>
                        <StatusBadge status={w.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(w.createdAt)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-red-400">
                      -{parseFloat(w.amount).toLocaleString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
