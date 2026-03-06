'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  User,
  Wallet,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileText,
  History,
  Gem,
  Trophy,
  Users,
  Mail,
  Headset,
  HelpCircle,
  CalendarCheck,
  Target,
  Lock,
  ChevronRight,
  Copy,
  Check,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { formatAmount } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';

const VIP_NAMES: Record<number, { name: string; icon: string }> = {
  1: { name: 'Bronze', icon: '🥉' },
  2: { name: 'Silver', icon: '🥈' },
  3: { name: 'Gold', icon: '🥇' },
  4: { name: 'Platinum', icon: '💎' },
  5: { name: 'Diamond', icon: '👑' },
  6: { name: 'Master', icon: '🏆' },
  7: { name: 'Grand Master', icon: '⭐' },
  8: { name: 'Champion', icon: '🌟' },
  9: { name: 'Legend', icon: '🔱' },
  10: { name: 'Mythic', icon: '✨' },
};

const QUICK_ACTIONS = [
  { name: '입금', href: '/wallet/deposit', icon: ArrowDownToLine, color: 'text-emerald-600' },
  { name: '출금', href: '/wallet/withdraw', icon: ArrowUpFromLine, color: 'text-blue-600' },
  { name: '거래내역', href: '/wallet/transactions', icon: FileText, color: 'text-purple-600' },
  { name: 'VIP', href: '/promotions/vip', icon: Trophy, color: 'text-amber-600' },
];

const PROMO_BANNERS = [
  { name: '프로모션', desc: '이벤트 정보', href: '/promotions', gradient: 'from-purple-600 to-indigo-600', icon: '🎁' },
  { name: '출석 보너스', desc: '매일 출석체크', href: '/promotions/attendance', gradient: 'from-blue-600 to-cyan-600', icon: '📅' },
  { name: '럭키 스핀', desc: '스핀 & 윈', href: '/promotions/spin', gradient: 'from-pink-600 to-rose-600', icon: '🎰' },
  { name: '미션 허브', desc: '미션 완료 보상', href: '/promotions/missions', gradient: 'from-amber-600 to-orange-600', icon: '🎯' },
  { name: '포인트', desc: '포인트 전환', href: '/promotions/points', gradient: 'from-emerald-600 to-teal-600', icon: '💰' },
];

const GENERAL_MENU = [
  { name: '프로필 설정', desc: '개인정보 수정', href: '/profile', icon: User, color: 'text-blue-600' },
  { name: '내 지갑', desc: '잔액 · 포인트', href: '/wallet/deposit', icon: Wallet, color: 'text-emerald-600' },
  { name: '입금', desc: '암호화폐 입금', href: '/wallet/deposit', icon: ArrowDownToLine, color: 'text-green-600' },
  { name: '출금', desc: '암호화폐 출금', href: '/wallet/withdraw', icon: ArrowUpFromLine, color: 'text-orange-600' },
  { name: '거래 내역', desc: '입출금 · 보너스', href: '/wallet/transactions', icon: CreditCard, color: 'text-purple-600' },
  { name: '베팅 내역', desc: '베팅 기록 · 상태', href: '/profile/bets', icon: FileText, color: 'text-red-600' },
  { name: '포인트 내역', desc: '적립 · 사용 현황', href: '/promotions/points', icon: Gem, color: 'text-cyan-600' },
];

const SERVICE_MENU = [
  { name: '추천/커미션', desc: '어필리에이트', href: '/affiliate', icon: Users, color: 'text-amber-600' },
  { name: '쪽지함', desc: '알림 · 공지', href: '/messages', icon: Mail, color: 'text-blue-600' },
  { name: '고객센터', desc: '문의 · 도움말', href: '/support', icon: Headset, color: 'text-green-600' },
  { name: '출석체크', desc: '매일 보상 받기', href: '/promotions/attendance', icon: CalendarCheck, color: 'text-pink-600' },
  { name: '미션', desc: '미션 완료 보상', href: '/promotions/missions', icon: Target, color: 'text-orange-600' },
  { name: '도움말', desc: '자주 묻는 질문', href: '/support', icon: HelpCircle, color: 'text-slate-400' },
];

const formatDateTime = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function ProfilePage() {
  const {
    profile,
    fetchProfile,
    updateProfile,
    changePassword,
  } = useProfileStore();

  const [editNickname, setEditNickname] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditNickname(profile.nickname);
      setEditPhone(profile.phone);
    }
  }, [profile]);

  const handleSaveNickname = async () => {
    await updateProfile(editNickname, profile?.phone || '');
    setIsEditingNickname(false);
  };

  const handleSavePhone = async () => {
    await updateProfile(profile?.nickname || '', editPhone);
    setIsEditingPhone(false);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('새 비밀번호가 일치하지 않습니다');
      return;
    }
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordError('비밀번호 변경에 실패했습니다');
    }
  };

  const handleCopyReferralCode = () => {
    if (profile?.myReferralCode) {
      navigator.clipboard.writeText(profile.myReferralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  if (!profile) return null;

  const vipData = VIP_NAMES[profile.vipLevel] || VIP_NAMES[1];
  const vipProgress = Math.min((profile.vipLevel / 10) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      {/* User Header Card */}
      <div className="rounded-lg bg-[#f5f5f7] p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-yellow-600 text-2xl font-bold text-white">
              {profile.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#252531]">{profile.username}</span>
                <span className="bg-[#feb614]/90 px-2 py-0.5 text-xs font-bold text-black rounded-md">
                  VIP {profile.vipLevel}
                </span>
              </div>
              <p className="text-xs text-[#6b7280]">
                마지막 접속: {formatDateTime(profile.lastLoginAt)}
              </p>
              <div className="mt-1 flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6b7280]">잔액</span>
                  <span className="text-sm font-bold text-[#feb614]">{formatAmount(profile.balance)}</span>
                </div>
                <div className="h-3 w-px bg-[#e8e8e8]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#6b7280]">포인트</span>
                  <span className="text-sm font-bold text-[#feb614]">{formatAmount(profile.points)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.name}
                  href={action.href}
                  className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors hover:bg-[#f0f0f2]"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#e8e8e8]">
                    <Icon className={`size-5 ${action.color}`} />
                  </div>
                  <span className="text-xs text-[#252531]">{action.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* VIP Progress */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-[#6b7280]">
            {vipData.icon} {vipData.name}
          </span>
          <Progress value={vipProgress} className="h-1.5 flex-1" />
          <span className="text-xs text-[#6b7280]">
            {profile.vipLevel < 10 ? `Next: ${VIP_NAMES[(profile.vipLevel + 1) as keyof typeof VIP_NAMES]?.name || ''}` : 'MAX'}
          </span>
        </div>
      </div>

      {/* Promo Banners Row */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {PROMO_BANNERS.map((promo) => (
          <Link
            key={promo.href + promo.name}
            href={promo.href}
            className={`flex min-w-[160px] flex-1 items-center gap-3 rounded-lg bg-gradient-to-r ${promo.gradient} p-3 transition-transform hover:scale-[1.02]`}
          >
            <span className="text-2xl">{promo.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{promo.name}</p>
              <p className="text-xs text-white/70">{promo.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* General Section */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h3 className="mb-5 border-l-4 border-[#feb614] pl-4 text-lg font-bold text-[#252531]">
          General
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {GENERAL_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[#f0f0f2]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8e8e8]">
                  <Icon className={`size-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#252531]">{item.name}</p>
                  <p className="truncate text-xs text-[#6b7280]">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Service Section */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h3 className="mb-5 border-l-4 border-[#feb614] pl-4 text-lg font-bold text-[#252531]">
          Service
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {SERVICE_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-[#f0f0f2]"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#e8e8e8]">
                  <Icon className={`size-5 ${item.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#252531]">{item.name}</p>
                  <p className="truncate text-xs text-[#6b7280]">{item.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Account Section */}
      <div className="rounded-lg bg-[#f5f5f7] p-5">
        <h3 className="mb-5 border-l-4 border-[#feb614] pl-4 text-lg font-bold text-[#252531]">
          Account
        </h3>
        <div className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-[#6b7280]" />
              <label className="text-sm text-[#6b7280]">아이디</label>
            </div>
            <span className="text-sm font-medium text-[#252531]">{profile.username}</span>
          </div>

          {/* Nickname */}
          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-[#6b7280]" />
              <label className="text-sm text-[#6b7280]">닉네임</label>
            </div>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="h-9 w-32 rounded-md border border-[#e8e8e8] bg-[#f5f5f7] px-3 text-sm text-[#252531] focus:border-[#feb614] focus:outline-none"
                />
                <button
                  className="bg-[#feb614] text-black font-medium rounded-md px-4 py-2 hover:bg-[#feb614]/90 text-sm"
                  onClick={handleSaveNickname}
                >
                  저장
                </button>
                <button
                  className="text-[#6b7280] hover:bg-[#f0f0f2] rounded-md px-3 py-1 text-sm"
                  onClick={() => setIsEditingNickname(false)}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#252531]">{profile.nickname}</span>
                <button
                  className="text-[#feb614] hover:bg-[#feb614]/10 text-xs h-7 px-2 rounded"
                  onClick={() => setIsEditingNickname(true)}
                >
                  수정
                </button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <User className="size-4 text-[#6b7280]" />
              <label className="text-sm text-[#6b7280]">전화번호</label>
            </div>
            {isEditingPhone ? (
              <div className="flex items-center gap-2">
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-9 w-36 rounded-md border border-[#e8e8e8] bg-[#f5f5f7] px-3 text-sm text-[#252531] focus:border-[#feb614] focus:outline-none"
                />
                <button
                  className="bg-[#feb614] text-black font-medium rounded-md px-4 py-2 hover:bg-[#feb614]/90 text-sm"
                  onClick={handleSavePhone}
                >
                  저장
                </button>
                <button
                  className="text-[#6b7280] hover:bg-[#f0f0f2] rounded-md px-3 py-1 text-sm"
                  onClick={() => setIsEditingPhone(false)}
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[#252531]">{profile.phone}</span>
                <button
                  className="text-[#feb614] hover:bg-[#feb614]/10 text-xs h-7 px-2 rounded"
                  onClick={() => setIsEditingPhone(true)}
                >
                  수정
                </button>
              </div>
            )}
          </div>

          {/* Referral Code */}
          <div className="flex items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Users className="size-4 text-[#6b7280]" />
              <label className="text-sm text-[#6b7280]">추천코드</label>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#feb614]">{profile.myReferralCode}</span>
              <button
                className="text-[#6b7280] hover:bg-[#f0f0f2] rounded-md px-3 py-1 h-7"
                onClick={handleCopyReferralCode}
              >
                {copiedCode ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
              </button>
            </div>
          </div>

          {/* Login history & Password */}
          <div className="flex gap-3">
            <Link
              href="/profile/login-history"
              className="flex flex-1 items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3 transition-colors hover:bg-[#f0f0f2]"
            >
              <div className="flex items-center gap-3">
                <History className="size-4 text-[#6b7280]" />
                <span className="text-sm text-[#252531]">접속 내역</span>
              </div>
              <ChevronRight className="size-4 text-[#6b7280]" />
            </Link>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-1 items-center justify-between rounded-lg bg-[#e8e8e8]/50 px-4 py-3 transition-colors hover:bg-[#f0f0f2]">
                  <div className="flex items-center gap-3">
                    <Lock className="size-4 text-[#6b7280]" />
                    <span className="text-sm text-[#252531]">비밀번호 변경</span>
                  </div>
                  <ChevronRight className="size-4 text-[#6b7280]" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>비밀번호 변경</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-sm text-[#6b7280]">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-[#e8e8e8] bg-[#f5f5f7] px-3 text-sm text-[#252531] focus:border-[#feb614] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-[#e8e8e8] bg-[#f5f5f7] px-3 text-sm text-[#252531] focus:border-[#feb614] focus:outline-none"
                      placeholder="8자 이상, 영문+숫자"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-[#6b7280]">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-[#e8e8e8] bg-[#f5f5f7] px-3 text-sm text-[#252531] focus:border-[#feb614] focus:outline-none"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-500">{passwordError}</p>
                  )}
                  <button
                    className="w-full bg-[#feb614] text-black font-medium rounded-md py-2 hover:bg-[#feb614]/90"
                    onClick={handleChangePassword}
                  >
                    변경하기
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
