'use client';

import { useEffect, useState } from 'react';
import { Copy, Share2, Users, DollarSign, TrendingUp } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'members' | 'commissions'>('members');

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
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#252531]">
          <span>🤝</span> 추천/어필리에이트
        </h2>
      </div>

      {/* Referral code */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#707070]">내 추천코드</p>
            <p className="text-lg font-bold text-[#f4b53e]">{referralCode}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(referralCode, 'code')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[#dddddd] bg-white text-[#707070] rounded-md hover:bg-[#f8f9fc] transition-colors"
            >
              <Copy className="size-3" />
              {copied === 'code' ? '복사됨' : '복사'}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[#dddddd] bg-white text-[#707070] rounded-md hover:bg-[#f8f9fc] transition-colors"
            >
              <Share2 className="size-3" />
              공유
            </button>
          </div>
        </div>

        <div className="border-t border-[#dddddd]" />

        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#707070]">추천 링크</p>
            <p className="truncate text-xs font-mono text-[#707070]">
              {referralLink}
            </p>
          </div>
          <button
            onClick={() => handleCopy(referralLink, 'link')}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-[#dddddd] bg-white text-[#707070] rounded-md hover:bg-[#f8f9fc] transition-colors shrink-0"
          >
            <Copy className="size-3" />
            {copied === 'link' ? '복사됨' : '복사'}
          </button>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg shadow-sm flex flex-col items-center gap-1 p-4">
          <Users className="size-5 text-blue-500" />
          <p className="text-xs text-[#707070]">총 추천</p>
          <p className="text-lg font-bold text-[#252531]">{dashboard?.totalReferrals || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm flex flex-col items-center gap-1 p-4">
          <DollarSign className="size-5 text-green-500" />
          <p className="text-xs text-[#707070]">이달 커미션</p>
          <p className="text-lg font-bold text-[#252531]">{formatAmount(dashboard?.thisMonthCommission || '0')}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm flex flex-col items-center gap-1 p-4">
          <TrendingUp className="size-5 text-yellow-500" />
          <p className="text-xs text-[#707070]">누적 커미션</p>
          <p className="text-lg font-bold text-[#252531]">{formatAmount(dashboard?.totalCommission || '0')}</p>
        </div>
      </div>

      {/* Rolling rates */}
      {dashboard?.rollingRates && dashboard.rollingRates.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 pb-3">
            <h3 className="text-base font-bold text-[#252531]">게임별 롤링 요율</h3>
          </div>
          <div className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {dashboard.rollingRates.map((rate) => (
                <div
                  key={rate.category}
                  className="flex items-center gap-1 rounded-md border border-[#dddddd] px-3 py-1.5"
                >
                  <span className="text-sm text-[#252531]">{rate.category}</span>
                  <span className="text-sm font-bold text-[#f4b53e]">{rate.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabs: Members / Commission History */}
      <div className="w-full">
        {/* Tab triggers */}
        <div className="flex rounded-lg overflow-hidden border border-[#dddddd]">
          <button
            onClick={() => setActiveTab('members')}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold transition-colors',
              activeTab === 'members'
                ? 'bg-[#f4b53e] text-white'
                : 'bg-[#edeef3] text-[#707070] hover:bg-[#e4e5ea]'
            )}
          >
            추천회원
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={cn(
              'flex-1 py-2.5 text-sm font-semibold transition-colors',
              activeTab === 'commissions'
                ? 'bg-[#f4b53e] text-white'
                : 'bg-[#edeef3] text-[#707070] hover:bg-[#e4e5ea]'
            )}
          >
            커미션내역
          </button>
        </div>

        {/* Tab content: Members */}
        {activeTab === 'members' && (
          <div className="bg-white rounded-lg shadow-sm mt-3">
            {affiliateMembers.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <span className="text-4xl">👤</span>
                <p className="text-sm text-[#707070]">추천회원이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dddddd]">
                      <th className="text-left text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">아이디</th>
                      <th className="text-left text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">닉네임</th>
                      <th className="text-right text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">총 베팅</th>
                      <th className="text-right text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">커미션</th>
                      <th className="text-right text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">가입일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateMembers.map((member) => (
                      <tr key={member.id} className="border-b border-[#dddddd] last:border-b-0">
                        <td className="text-sm text-[#252531] px-4 py-3">{member.username}</td>
                        <td className="text-sm text-[#252531] px-4 py-3">{member.nickname}</td>
                        <td className="text-right text-sm text-[#252531] px-4 py-3">
                          {formatAmount(member.totalBet)}
                        </td>
                        <td className="text-right text-sm text-green-600 px-4 py-3">
                          {formatAmount(member.commission)}
                        </td>
                        <td className="text-right text-xs text-[#707070] px-4 py-3">
                          {formatDate(member.joinedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab content: Commissions */}
        {activeTab === 'commissions' && (
          <div className="bg-white rounded-lg shadow-sm mt-3">
            {commissionRecords.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <span className="text-4xl">💰</span>
                <p className="text-sm text-[#707070]">커미션내역이 없습니다</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#dddddd]">
                      <th className="text-left text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">유형</th>
                      <th className="text-left text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">게임</th>
                      <th className="text-left text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">회원</th>
                      <th className="text-right text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">금액</th>
                      <th className="text-right text-xs font-medium text-[#707070] bg-[#f8f9fc] px-4 py-2.5">일시</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissionRecords.map((record) => (
                      <tr key={record.id} className="border-b border-[#dddddd] last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="inline-block text-[10px] font-medium bg-[#edeef3] text-[#707070] px-2 py-0.5 rounded">
                            {record.type === 'rolling' ? '롤링' : '죽장'}
                          </span>
                        </td>
                        <td className="text-sm text-[#252531] px-4 py-3">{record.gameCategory}</td>
                        <td className="text-sm text-[#252531] px-4 py-3">{record.fromUser}</td>
                        <td className="text-right text-sm text-green-600 px-4 py-3">
                          +{formatAmount(record.amount)}
                        </td>
                        <td className="text-right text-xs text-[#707070] px-4 py-3">
                          {formatDateTime(record.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
