'use client';

import { useEffect, useState, useCallback } from 'react';
import { Copy, Check, AlertTriangle, Loader2 } from 'lucide-react';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">입금</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {/* Coin selection */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              코인 선택
            </Label>
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

          {/* Network */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              네트워크
            </Label>
            <div className="rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium">
              {network}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              입금 금액
            </Label>
            <div className="relative">
              <Input
                type="number"
                placeholder={`최소 ${minAmount}`}
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
            <p className="mt-1 text-xs text-muted-foreground">
              최소 입금액: {minAmount} {selectedCoin}
            </p>
          </div>

          <Separator />

          {/* Deposit address */}
          <div>
            <Label className="mb-2 block text-sm text-muted-foreground">
              입금 주소
            </Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 overflow-hidden rounded-lg border border-border bg-secondary/50 px-3 py-2.5">
                <p className="truncate font-mono text-sm">{depositAddress}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0 gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="size-4 text-green-400" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="size-4" />
                    복사
                  </>
                )}
              </Button>
            </div>

            {/* QR code placeholder */}
            <div className="mt-3 flex justify-center">
              <div className="flex size-40 items-center justify-center rounded-lg border-2 border-dashed border-border bg-secondary/30">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">QR Code</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                    {truncateHash(depositAddress)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning box */}
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">주의사항</p>
                <ul className="mt-1 flex flex-col gap-1 text-destructive/80">
                  <li>{network} 네트워크로만 전송하세요</li>
                  <li>다른 네트워크로 전송 시 자산을 잃을 수 있습니다</li>
                  <li>최소 입금액: {minAmount} {selectedCoin}</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* Submit button */}
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !amount}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                처리 중...
              </>
            ) : (
              '입금 신청'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent deposits */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">최근 입금 내역</CardTitle>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <p className="text-sm text-muted-foreground">
                입금 내역이 없습니다
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
                    {deposits.slice(0, 5).map((d: Deposit) => (
                      <TableRow key={d.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(d.createdAt)}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {d.coinType}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium text-green-400">
                          +{parseFloat(d.amount).toLocaleString('ko-KR')}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {truncateHash(d.txHash || '')}
                        </TableCell>
                        <TableCell className="text-center">
                          <StatusBadge status={d.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card layout */}
              <div className="flex flex-col gap-2 sm:hidden">
                {deposits.slice(0, 5).map((d: Deposit) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-3 py-2.5"
                  >
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{d.coinType}</span>
                        <StatusBadge status={d.status} />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(d.createdAt)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-green-400">
                      +{parseFloat(d.amount).toLocaleString('ko-KR')}
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
