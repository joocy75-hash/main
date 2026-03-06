'use client';

import { useEffect, useState } from 'react';
import { Copy, Share2, Users, DollarSign, TrendingUp } from 'lucide-react';
import { cn, formatAmount } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';

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
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
        <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
          <h2 className="flex items-center gap-2 text-[18px] font-black text-[#1e293b] drop-shadow-sm">
            <span className="text-xl">🤝</span> 추천 / 어필리에이트
          </h2>
          <p className="mt-1 text-[13px] font-bold text-[#64748b]">
            친구를 초대하고 함께 플레이하며 평생 커미션을 받으세요.
          </p>
        </div>
      </div>

      {/* Referral Link & Code Section */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] p-5 flex flex-col gap-4">
        {/* Referral code */}
        <div className="flex items-center justify-between bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-[#e2e8f0] p-4 rounded-xl shadow-[inset_0_2px_4px_rgba(255,255,255,1)]">
          <div>
            <p className="text-[12px] font-extrabold text-[#94a3b8] mb-0.5">내 추천코드</p>
            <p className="text-[20px] font-black text-[#f59e0b] drop-shadow-sm tracking-widest">{referralCode}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleCopy(referralCode, 'code')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-black bg-white border border-[#e2e8f0] text-[#64748b] rounded-xl shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              {copied === 'code' ? (
                <span className="text-[#10b981] flex items-center gap-1.5">
                  <span className="text-[14px]">✔️</span> 복사됨
                </span>
              ) : (
                <>
                  <Copy className="size-4" /> 복사
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-black bg-gradient-to-b from-[#10b981] to-[#059669] border border-[#059669] text-white rounded-xl shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_2px_4px_rgba(16,185,129,0.3)] hover:-translate-y-0.5 hover:shadow-[inset_0_-2px_0_rgba(0,0,0,0.2),_0_4px_8px_rgba(16,185,129,0.4)] transition-all"
            >
              <Share2 className="size-4 drop-shadow-sm" /> 공유
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-[#e2e8f0] to-transparent" />

        {/* Referral Link */}
        <div className="flex items-center justify-between gap-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] p-3 rounded-xl">
          <div className="flex-1 min-w-0 px-2">
            <p className="text-[11px] font-extrabold text-[#94a3b8] mb-0.5">추천 링크</p>
            <p className="truncate text-[13px] font-bold text-[#475569] select-all cursor-pointer bg-white px-2 py-1 rounded border border-[#e2e8f0] shadow-inner">
              {referralLink}
            </p>
          </div>
          <button
            onClick={() => handleCopy(referralLink, 'link')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-black bg-white border border-[#e2e8f0] text-[#64748b] rounded-lg shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all shrink-0 h-[40px]"
          >
            {copied === 'link' ? (
              <span className="text-[#10b981]">복사됨</span>
            ) : (
              <>
                <Copy className="size-3.5" /> 복사
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] flex flex-col items-center justify-center p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 size-20 rounded-full bg-blue-500/10 blur-xl pointer-events-none" />
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-[inset_0_2px_4px_rgba(255,255,255,1)] mb-3">
            <Users className="size-6 text-blue-500 drop-shadow-sm" />
          </div>
          <p className="text-[13px] font-extrabold text-[#64748b] mb-1">총 추천 인원</p>
          <p className="text-[24px] font-black text-[#1e293b]">{dashboard?.totalReferrals || 0}<span className="text-[15px] text-[#94a3b8] ml-1">명</span></p>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] flex flex-col items-center justify-center p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 size-20 rounded-full bg-green-500/10 blur-xl pointer-events-none" />
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-[inset_0_2px_4px_rgba(255,255,255,1)] mb-3">
            <DollarSign className="size-6 text-green-500 drop-shadow-sm" />
          </div>
          <p className="text-[13px] font-extrabold text-[#64748b] mb-1">이달 커미션</p>
          <p className="text-[24px] font-black text-[#1e293b]">
            <span className="text-[#10b981] mr-1">+</span>{formatAmount(dashboard?.thisMonthCommission || '0')}
          </p>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] flex flex-col items-center justify-center p-6 transition-transform hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 size-20 rounded-full bg-yellow-500/10 blur-xl pointer-events-none" />
          <div className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-[inset_0_2px_4px_rgba(255,255,255,1)] mb-3">
            <TrendingUp className="size-6 text-yellow-500 drop-shadow-sm" />
          </div>
          <p className="text-[13px] font-extrabold text-[#64748b] mb-1">누적 커미션</p>
          <p className="text-[24px] font-black text-[#1e293b]">
            <span className="text-[#f59e0b] mr-1">T</span>{formatAmount(dashboard?.totalCommission || '0')}
          </p>
        </div>
      </div>

      {/* Rolling rates */}
      {dashboard?.rollingRates && dashboard.rollingRates.length > 0 && (
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden">
          <div className="border-b border-[#e2e8f0] px-5 py-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9]">
            <h3 className="text-[15px] font-black text-[#1e293b] flex items-center gap-2">
              <span className="text-[18px]">📊</span> 나의 게임별 롤링 요율
            </h3>
          </div>
          <div className="p-5 bg-[#fbfcfd]">
            <div className="flex flex-wrap gap-3">
              {dashboard.rollingRates.map((rate) => (
                <div
                  key={rate.category}
                  className="flex items-center gap-2 rounded-xl border border-[#cbd5e1] bg-white px-4 py-2.5 shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-0.5"
                >
                  <span className="text-[13px] font-black text-[#475569]">{rate.category}</span>
                  <div className="w-px h-3 bg-[#e2e8f0]"></div>
                  <span className="text-[15px] font-black text-[#f59e0b] drop-shadow-sm">{rate.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Action Bar (Tabs & Table Wrapper) */}
      <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#e2e8f0] overflow-hidden flex flex-col">
        {/* Tab triggers - 3D Pill Style */}
        <div className="p-4 bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] border-b border-[#e2e8f0]">
          <div className="flex gap-2 rounded-xl bg-[#e2e8f0]/50 p-1.5 border border-[#cbd5e1]/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] sm:w-fit">
            <button
              onClick={() => setActiveTab('members')}
              className={cn(
                'min-w-[140px] px-6 py-2.5 text-[14px] font-black rounded-lg transition-all',
                activeTab === 'members'
                  ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white shadow-[0_2px_4px_rgba(245,158,11,0.3),_inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'text-[#64748b] hover:bg-white hover:text-[#1e293b] hover:shadow-sm'
              )}
            >
              👫 추천 맺은 회원
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={cn(
                'min-w-[140px] px-6 py-2.5 text-[14px] font-black rounded-lg transition-all',
                activeTab === 'commissions'
                  ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] text-white shadow-[0_2px_4px_rgba(245,158,11,0.3),_inset_0_1px_1px_rgba(255,255,255,0.4)]'
                  : 'text-[#64748b] hover:bg-white hover:text-[#1e293b] hover:shadow-sm'
              )}
            >
              💰 커미션 지급 내역
            </button>
          </div>
        </div>

        {/* Tab content: Members */}
        {activeTab === 'members' && (
          <div className="p-5 bg-[#fbfcfd]">
            {affiliateMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 bg-[#f8fafc] rounded-xl border border-dashed border-[#cbd5e1]">
                <span className="text-4xl opacity-50 grayscale">👤</span>
                <p className="text-[14px] font-extrabold text-[#94a3b8]">현재 추천 맺은 회원이 없습니다</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <th className="text-left text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">아이디</th>
                        <th className="text-left text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">닉네임</th>
                        <th className="text-right text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">총 베팅</th>
                        <th className="text-right text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">지급 커미션</th>
                        <th className="text-right text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">가입일</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {affiliateMembers.map((member) => (
                        <tr key={member.id} className="border-b border-[#e2e8f0] last:border-b-0 transition-colors hover:bg-[#f8fafc]">
                          <td className="text-[14px] font-black text-[#1e293b] px-5 py-4">{member.username}</td>
                          <td className="text-[13px] font-bold text-[#475569] px-5 py-4">{member.nickname}</td>
                          <td className="text-right text-[14px] font-black text-[#475569] px-5 py-4">
                            {formatAmount(member.totalBet)}
                          </td>
                          <td className="text-right text-[14px] font-black text-[#10b981] drop-shadow-sm px-5 py-4">
                            + {formatAmount(member.commission)}
                          </td>
                          <td className="text-right text-[12px] font-bold text-[#94a3b8] px-5 py-4">
                            {formatDate(member.joinedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab content: Commissions */}
        {activeTab === 'commissions' && (
          <div className="p-5 bg-[#fbfcfd]">
            {commissionRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 bg-[#f8fafc] rounded-xl border border-dashed border-[#cbd5e1]">
                <span className="text-4xl opacity-50 grayscale">🧾</span>
                <p className="text-[14px] font-extrabold text-[#94a3b8]">커미션 지급 내역이 없습니다</p>
              </div>
            ) : (
              <div className="rounded-xl border border-[#e2e8f0] overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px]">
                    <thead>
                      <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                        <th className="text-left text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">유형</th>
                        <th className="text-left text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">게임</th>
                        <th className="text-left text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">회원</th>
                        <th className="text-right text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">지급 금액</th>
                        <th className="text-right text-[12px] font-extrabold text-[#64748b] px-5 py-3.5">일시</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {commissionRecords.map((record) => (
                        <tr key={record.id} className="border-b border-[#e2e8f0] last:border-b-0 transition-colors hover:bg-[#f8fafc]">
                          <td className="px-5 py-4">
                            <span className={cn(
                              "inline-flex items-center text-[11px] font-black px-2.5 py-1 rounded-md shadow-sm border",
                              record.type === 'rolling' 
                                ? "bg-amber-50 text-[#f59e0b] border-amber-200"
                                : "bg-blue-50 text-blue-600 border-blue-200"
                            )}>
                              {record.type === 'rolling' ? '롤링적립' : '루징적립'}
                            </span>
                          </td>
                          <td className="text-[13px] font-black text-[#475569] px-5 py-4">{record.gameCategory}</td>
                          <td className="text-[13px] font-bold text-[#475569] px-5 py-4">{record.fromUser}</td>
                          <td className="text-right text-[14px] font-black text-[#10b981] drop-shadow-sm px-5 py-4">
                            +{formatAmount(record.amount)}
                          </td>
                          <td className="text-right text-[12px] font-bold text-[#94a3b8] px-5 py-4">
                            {formatDateTime(record.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
