'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransactionList } from '@/hooks/use-transactions';
import { getTxExplorerUrl, getAddressExplorerUrl, getExplorerName, shortenHash } from '@/lib/blockchain';
import { formatAmount } from '@/lib/utils';
import { ArrowDownCircle, ArrowUpCircle, Copy, Check, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  pending: '대기', approved: '승인', rejected: '거부', completed: '완료',
};
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  approved: 'bg-blue-500/10 text-blue-500',
  rejected: 'bg-red-500/10 text-red-500',
  completed: 'bg-blue-500/10 text-blue-500',
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Button aria-label={copied ? '복사됨' : '복사'} variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={handleCopy}>
      {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function HashWithLink({ hash, network, type }: { hash: string; network?: string | null; type: 'tx' | 'address' }) {
  const url = type === 'tx' ? getTxExplorerUrl(hash, network) : getAddressExplorerUrl(hash, network);
  return (
    <div className="flex items-center gap-1">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-blue-400 hover:text-blue-500 hover:underline"
          title={`${getExplorerName(network)}에서 확인`}
        >
          {shortenHash(hash)}
        </a>
      ) : (
        <code className="text-xs font-mono text-muted-foreground">{shortenHash(hash)}</code>
      )}
      <CopyBtn text={hash} />
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-blue-400">
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

type Props = { userId: number };

export default function TabTransactions({ userId }: Props) {
  const [depositPage, setDepositPage] = useState(1);
  const [withdrawalPage, setWithdrawalPage] = useState(1);

  const { data: depositData, loading: depositLoading } = useTransactionList({
    user_id: userId,
    type: 'deposit',
    page: depositPage,
    page_size: 10,
  });

  const { data: withdrawalData, loading: withdrawalLoading } = useTransactionList({
    user_id: userId,
    type: 'withdrawal',
    page: withdrawalPage,
    page_size: 10,
  });

  return (
    <div className="space-y-6">
      {/* Deposit List */}
      <Card>
        <CardHeader><CardTitle className="text-base">입금 내역</CardTitle></CardHeader>
        <CardContent className="p-0">
          {depositLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !depositData?.items.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowDownCircle className="h-10 w-10 mb-3" />
              <p className="text-base font-medium">입금 내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-center">코인</th>
                    <th className="px-4 py-2 text-center">네트워크</th>
                    <th className="px-4 py-2 text-left">TX Hash</th>
                    <th className="px-4 py-2 text-center">상태</th>
                    <th className="px-4 py-2 text-left">신청일</th>
                    <th className="px-4 py-2 text-left">처리일</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {depositData.items.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-right font-mono text-blue-400">+{formatAmount(tx.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        {tx.coin_type ? <Badge variant="outline" className="text-xs">{tx.coin_type}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {tx.network ? <Badge variant="secondary" className="text-xs">{tx.network}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {tx.tx_hash ? (
                          <HashWithLink hash={tx.tx_hash} network={tx.network} type="tx" />
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Badge className={STATUS_COLORS[tx.status] || ''} variant="secondary">
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString('ko-KR')}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{tx.processed_at ? new Date(tx.processed_at).toLocaleString('ko-KR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {depositData && depositData.total > 10 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">총 {depositData.total}건</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={depositPage <= 1} onClick={() => setDepositPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />이전
                </Button>
                <span className="text-xs tabular-nums">{depositPage} / {Math.ceil(depositData.total / 10)}</span>
                <Button variant="outline" size="sm" disabled={depositPage >= Math.ceil(depositData.total / 10)} onClick={() => setDepositPage((p) => p + 1)}>
                  다음<ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Withdrawal List */}
      <Card>
        <CardHeader><CardTitle className="text-base">출금 내역</CardTitle></CardHeader>
        <CardContent className="p-0">
          {withdrawalLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !withdrawalData?.items.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ArrowUpCircle className="h-10 w-10 mb-3" />
              <p className="text-base font-medium">출금 내역이 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                    <th className="px-4 py-2 text-right">금액</th>
                    <th className="px-4 py-2 text-center">코인</th>
                    <th className="px-4 py-2 text-center">네트워크</th>
                    <th className="px-4 py-2 text-left">출금 주소</th>
                    <th className="px-4 py-2 text-left">TX Hash</th>
                    <th className="px-4 py-2 text-center">상태</th>
                    <th className="px-4 py-2 text-left">신청일</th>
                    <th className="px-4 py-2 text-left">처리일</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {withdrawalData.items.map((tx) => (
                    <tr key={tx.id} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-right font-mono text-red-400">-{formatAmount(tx.amount)}</td>
                      <td className="px-4 py-2 text-center">
                        {tx.coin_type ? <Badge variant="outline" className="text-xs">{tx.coin_type}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {tx.network ? <Badge variant="secondary" className="text-xs">{tx.network}</Badge> : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {tx.wallet_address ? (
                          <HashWithLink hash={tx.wallet_address} network={tx.network} type="address" />
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        {tx.tx_hash ? (
                          <HashWithLink hash={tx.tx_hash} network={tx.network} type="tx" />
                        ) : '-'}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <Badge className={STATUS_COLORS[tx.status] || ''} variant="secondary">
                          {STATUS_LABELS[tx.status] || tx.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString('ko-KR')}</td>
                      <td className="px-4 py-2 text-xs text-muted-foreground">{tx.processed_at ? new Date(tx.processed_at).toLocaleString('ko-KR') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {withdrawalData && withdrawalData.total > 10 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <span className="text-xs text-muted-foreground">총 {withdrawalData.total}건</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={withdrawalPage <= 1} onClick={() => setWithdrawalPage((p) => p - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />이전
                </Button>
                <span className="text-xs tabular-nums">{withdrawalPage} / {Math.ceil(withdrawalData.total / 10)}</span>
                <Button variant="outline" size="sm" disabled={withdrawalPage >= Math.ceil(withdrawalData.total / 10)} onClick={() => setWithdrawalPage((p) => p + 1)}>
                  다음<ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
