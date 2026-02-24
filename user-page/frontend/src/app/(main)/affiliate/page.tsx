'use client';

import { useEffect, useState } from 'react';
import { Copy, Share2, Users, DollarSign, TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';

const formatAmount = (value: string) =>
  new Intl.NumberFormat('ko-KR').format(Number(value));

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  });
};

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function AffiliatePage() {
  const {
    profile,
    affiliateDashboard,
    affiliateMembers,
    commissionRecords,
    fetchProfile,
    fetchAffiliateDashboard,
    fetchAffiliateMembers,
    fetchCommissionRecords,
  } = useProfileStore();

  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  useEffect(() => {
    fetchProfile();
    fetchAffiliateDashboard();
    fetchAffiliateMembers();
    fetchCommissionRecords();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const referralCode = profile?.myReferralCode || 'TESTCODE';
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

  const handleCopy = async (text: string, type: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback copy method
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Game Platform 추천',
          text: `Game Platform에서 함께 플레이하세요! 추천코드: ${referralCode}`,
          url: referralLink,
        });
      } catch {
        // Share cancelled or failed
      }
    } else {
      handleCopy(referralLink, 'link');
    }
  };

  const dashboard = affiliateDashboard;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>🤝</span> 추천/어필리에이트
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Referral code */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">내 추천코드</p>
              <p className="text-lg font-bold text-primary">{referralCode}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(referralCode, 'code')}
                className="gap-1"
              >
                <Copy className="size-3" />
                {copied === 'code' ? '복사됨' : '복사'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-1"
              >
                <Share2 className="size-3" />
                공유
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">추천 링크</p>
              <p className="truncate text-xs font-mono text-muted-foreground">
                {referralLink}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(referralLink, 'link')}
            >
              <Copy className="size-3" />
              {copied === 'link' ? '복사됨' : '복사'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <Users className="size-5 text-blue-400" />
            <p className="text-xs text-muted-foreground">총 추천</p>
            <p className="text-lg font-bold">{dashboard?.totalReferrals || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <DollarSign className="size-5 text-green-400" />
            <p className="text-xs text-muted-foreground">이달 커미션</p>
            <p className="text-lg font-bold">{formatAmount(dashboard?.thisMonthCommission || '0')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 pt-4">
            <TrendingUp className="size-5 text-yellow-400" />
            <p className="text-xs text-muted-foreground">누적 커미션</p>
            <p className="text-lg font-bold">{formatAmount(dashboard?.totalCommission || '0')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Rolling rates */}
      {dashboard?.rollingRates && dashboard.rollingRates.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">게임별 롤링 요율</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboard.rollingRates.map((rate) => (
                <div
                  key={rate.category}
                  className="flex items-center gap-1 rounded-md border border-border px-3 py-1.5"
                >
                  <span className="text-sm">{rate.category}</span>
                  <span className="text-sm font-bold text-primary">{rate.rate}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs: Members / Commission History */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="members" className="flex-1">추천회원</TabsTrigger>
          <TabsTrigger value="commissions" className="flex-1">커미션내역</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-0">
              {affiliateMembers.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <span className="text-4xl">👤</span>
                  <p className="text-sm text-muted-foreground">추천회원이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>아이디</TableHead>
                        <TableHead>닉네임</TableHead>
                        <TableHead className="text-right">총 베팅</TableHead>
                        <TableHead className="text-right">커미션</TableHead>
                        <TableHead className="text-right">가입일</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="text-sm">{member.username}</TableCell>
                          <TableCell className="text-sm">{member.nickname}</TableCell>
                          <TableCell className="text-right text-sm">
                            {formatAmount(member.totalBet)}
                          </TableCell>
                          <TableCell className="text-right text-sm text-green-400">
                            {formatAmount(member.commission)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDate(member.joinedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commissions">
          <Card>
            <CardContent className="p-0">
              {commissionRecords.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12">
                  <span className="text-4xl">💰</span>
                  <p className="text-sm text-muted-foreground">커미션내역이 없습니다</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>유형</TableHead>
                        <TableHead>게임</TableHead>
                        <TableHead>회원</TableHead>
                        <TableHead className="text-right">금액</TableHead>
                        <TableHead className="text-right">일시</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            <Badge variant="secondary" className="text-[10px]">
                              {record.type === 'rolling' ? '롤링' : '죽장'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{record.gameCategory}</TableCell>
                          <TableCell className="text-sm">{record.fromUser}</TableCell>
                          <TableCell className="text-right text-sm text-green-400">
                            +{formatAmount(record.amount)}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {formatDateTime(record.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
