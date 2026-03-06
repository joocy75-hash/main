'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Wallet, Star, TrendingUp, TrendingDown } from 'lucide-react';

function formatUSDT(amount: number): string {
  return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
}

type Props = {
  balance: number;
  points: number;
  totalDeposit: number;
  totalWithdrawal: number;
};

export default function AssetSection({ balance, points, totalDeposit, totalWithdrawal }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-blue-400"><Wallet className="h-4 w-4" />잔액</div>
          <p className="text-2xl font-bold mt-1 text-blue-500">{formatUSDT(balance)}</p>
        </CardContent>
      </Card>
      <Card className="bg-purple-500/10 border-purple-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-purple-400"><Star className="h-4 w-4" />포인트</div>
          <p className="text-2xl font-bold mt-1 text-purple-500">{formatUSDT(points)}</p>
        </CardContent>
      </Card>
      <Card className="bg-green-500/10 border-green-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-green-400"><TrendingUp className="h-4 w-4" />총 입금액</div>
          <p className="text-2xl font-bold mt-1 text-green-500">{formatUSDT(totalDeposit)}</p>
        </CardContent>
      </Card>
      <Card className="bg-red-500/10 border-red-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm text-red-400"><TrendingDown className="h-4 w-4" />총 출금액</div>
          <p className="text-2xl font-bold mt-1 text-red-500">{formatUSDT(totalWithdrawal)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
