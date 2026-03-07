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
import {
  Dialog,
  DialogContent,
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
    setWithdrawPin,
    changeWithdrawPin,
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
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinPassword, setPinPassword] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [pinError, setPinError] = useState('');

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

  const handlePinSubmit = async () => {
    setPinError('');
    if (!/^\d{6}$/.test(newPin)) {
      setPinError('PIN은 6자리 숫자여야 합니다');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('PIN이 일치하지 않습니다');
      return;
    }
    try {
      if (profile?.hasWithdrawPin) {
        await changeWithdrawPin(pinPassword, currentPin, newPin);
      } else {
        await setWithdrawPin(pinPassword, newPin);
      }
      setPinDialogOpen(false);
      setPinPassword('');
      setNewPin('');
      setConfirmPin('');
      setCurrentPin('');
      await fetchProfile();
    } catch {
      setPinError('PIN 설정에 실패했습니다');
    }
  };

  if (!profile) return null;

  const vipData = VIP_NAMES[profile.vipLevel] || VIP_NAMES[1];
  const vipProgress = Math.min((profile.vipLevel / 10) * 100, 100);

  return (
    <div className="flex flex-col gap-4">
      {/* User Header Card */}
      {/* User Header Card - 3D Glossy Style */}
      <div className="relative rounded-2xl bg-white p-5 border border-[#e5e9f0] shadow-[0_6px_16px_rgba(0,0,0,0.06),_inset_0_2px_0_rgba(255,255,255,1)] overflow-hidden">
        {/* Top Gloss */}
        <div className="absolute inset-x-0 top-0 h-[30%] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none"></div>
        {/* Diagonal Light */}
        <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] rounded-full bg-gradient-to-b from-blue-100/30 to-transparent blur-3xl pointer-events-none"></div>

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between z-10">
          {/* Left: Avatar + Info */}
          <div className="flex items-center gap-5">
            {/* 3D Avatar */}
            <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#feb614] via-[#f4b53e] to-[#e09800] text-3xl font-black text-white shadow-[0_4px_10px_rgba(254,182,20,0.4),_inset_0_-4px_0_rgba(0,0,0,0.15),_inset_0_2px_4px_rgba(255,255,255,0.6)] border-2 border-white/50 ring-2 ring-[#feb614]/30">
              <div className="drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)]">{profile.username.charAt(0).toUpperCase()}</div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5">
                <span className="text-[20px] font-black tracking-tight text-[#1e293b]">{profile.username}</span>
                <span className="bg-gradient-to-b from-[#feb614] to-[#e69d00] px-2.5 py-0.5 text-[11px] font-black text-white rounded-md shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(254,182,20,0.3)]">
                  VIP {profile.vipLevel}
                </span>
              </div>
              <p className="text-[12px] font-bold text-[#64748b]">
                마지막 접속: {formatDateTime(profile.lastLoginAt)}
              </p>
              <div className="mt-1 flex items-center gap-3 bg-[#f8fafc] px-3 py-1.5 rounded-lg border border-[#e2e8f0] shadow-inner w-fit">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-[#6b7583]">잔액</span>
                  <span className="text-[14px] font-black text-[#3b82f6] tracking-tight">{formatAmount(profile.balance)}</span>
                </div>
                <div className="h-3 w-px bg-[#cbd5e1]" />
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold text-[#6b7583]">포인트</span>
                  <span className="text-[14px] font-black text-[#10b981] tracking-tight">{formatAmount(profile.points)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 md:gap-3 bg-[#f8fafc] p-1.5 rounded-xl border border-[#e2e8f0] shadow-inner">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.name}
                  href={action.href}
                  className="group flex flex-col items-center gap-1.5 rounded-lg w-[64px] py-2 transition-all hover:bg-white hover:shadow-[0_4px_10px_rgba(0,0,0,0.06),_0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className={`flex size-[34px] items-center justify-center rounded-full bg-gradient-to-b from-white to-[#f1f5f9] shadow-[0_2px_4px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-[#e2e8f0] group-hover:-translate-y-0.5 transition-transform ${action.color}`}>
                    <Icon className="size-4" strokeWidth={3} />
                  </div>
                  <span className="text-[11px] font-bold text-[#64748b] group-hover:text-[#1e293b] transition-colors tracking-tight">{action.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 3D VIP Progress */}
        <div className="relative mt-5 pt-4 border-t border-[#e2e8f0] flex items-center gap-4 z-10 bg-gradient-to-b from-transparent to-[#fafbfc] -mx-5 px-5 pb-1">
          <div className="flex items-center justify-center size-[32px] rounded-full bg-gradient-to-br from-[#f8fafc] to-[#e2e8f0] border border-white shadow-[0_2px_4px_rgba(0,0,0,0.08)]">
             <span className="text-sm drop-shadow-sm">{vipData.icon}</span>
          </div>
          <div className="flex-1 relative group cursor-pointer">
            <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-[#1e293b] text-white text-[10px] font-bold py-1 px-2 rounded-md whitespace-nowrap left-1/2 -translate-x-1/2 shadow-lg z-20 pointer-events-none">
              {vipProgress.toFixed(1)}% 달성
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1e293b]"></div>
            </div>
            {/* Track */}
            <div className="h-2.5 w-full rounded-full bg-[#e2e8f0] shadow-inner overflow-hidden border border-[#cbd5e1]/50 relative">
              {/* Fill */}
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#feb614] via-[#fcd34d] to-[#f59e0b] shadow-[inset_0_-1px_2px_rgba(0,0,0,0.2),_inset_0_1px_2px_rgba(255,255,255,0.8)] relative"
                style={{ width: `${vipProgress}%` }}
              >
                  {/* Gloss on fill */}
                  <div className="absolute inset-0 h-1/2 bg-white/30 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="text-[11px] font-black text-[#64748b] bg-[#f1f5f9] px-2 py-0.5 rounded shadow-inner border border-[#e2e8f0]">
            NEXT: <span className="text-[#1e293b]">{profile.vipLevel < 10 ? VIP_NAMES[(profile.vipLevel + 1) as keyof typeof VIP_NAMES]?.name : 'MAX'}</span>
          </div>
        </div>
      </div>

      {/* Promo Banners Row - 3D Cards */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide">
        {PROMO_BANNERS.map((promo) => (
          <Link
            key={promo.href + promo.name}
            href={promo.href}
            className={`flex min-w-[200px] flex-1 items-center gap-3 rounded-[14px] bg-gradient-to-r ${promo.gradient} p-4 transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_2px_4px_rgba(255,255,255,0.2)] relative overflow-hidden`}
          >
            {/* Top Gloss Highlights */}
            <div className="absolute inset-x-0 top-0 h-[40%] bg-white/10" />
            
            <div className="flex items-center justify-center size-[42px] bg-white/20 rounded-full shadow-inner border border-white/20 z-10 shrink-0">
              <span className="text-[22px] drop-shadow-md">{promo.icon}</span>
            </div>
            <div className="z-10 bg-black/10 px-2 py-1 rounded-md border border-white/10 w-full">
              <p className="text-[13px] font-black tracking-tight text-white drop-shadow-sm">{promo.name}</p>
              <p className="text-[10.5px] font-bold text-white/80">{promo.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: Menus */}
        <div className="flex flex-col gap-4">
          
          {/* General Menu Panel */}
          <div className="rounded-[16px] bg-white border border-[#e5e9f0] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-5 py-3 border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white] flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#3b82f6] rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <h3 className="text-[15px] font-black text-[#1e293b] tracking-tight">계정 관리</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-[#e2e8f0] p-[1px]">
              {GENERAL_MENU.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.name}
                    href={item.href}
                    className="group bg-white flex flex-col items-center justify-center gap-2 p-5 transition-all hover:bg-[#f8fafc] content-center"
                  >
                    <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white to-[#f1f5f9] shadow-[0_2px_5px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.03)] ring-1 ring-[#e2e8f0] group-hover:-translate-y-1 transition-transform">
                      <Icon className={`size-[20px] ${item.color}`} strokeWidth={2.5} />
                    </div>
                    <div className="text-center min-w-0 px-1">
                      <p className="text-[13px] font-black tracking-tight text-[#1e293b] truncate leading-tight group-hover:text-[#3b82f6] transition-colors">{item.name}</p>
                      <p className="text-[10px] font-bold text-[#8995a5] truncate mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Service Menu Panel */}
          <div className="rounded-[16px] bg-white border border-[#e5e9f0] shadow-sm overflow-hidden flex flex-col">
            <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-5 py-3 border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white] flex items-center gap-2">
              <div className="w-1.5 h-4 bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <h3 className="text-[15px] font-black text-[#1e293b] tracking-tight">서비스 & 혜택</h3>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-[1px] bg-[#e2e8f0] p-[1px]">
              {SERVICE_MENU.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.name}
                    href={item.href}
                    className="group bg-white flex flex-col items-center justify-center gap-2 p-5 transition-all hover:bg-[#f8fafc] content-center"
                  >
                    <div className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-gradient-to-b from-white to-[#f1f5f9] shadow-[0_2px_5px_rgba(0,0,0,0.06),_inset_0_-2px_0_rgba(0,0,0,0.03)] ring-1 ring-[#e2e8f0] group-hover:-translate-y-1 transition-transform">
                      <Icon className={`size-[20px] ${item.color}`} strokeWidth={2.5} />
                    </div>
                    <div className="text-center min-w-0 px-1">
                      <p className="text-[13px] font-black tracking-tight text-[#1e293b] truncate leading-tight group-hover:text-[#10b981] transition-colors">{item.name}</p>
                      <p className="text-[10px] font-bold text-[#8995a5] truncate mt-0.5">{item.desc}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Account Setting Panel */}
        <div className="rounded-[16px] bg-white border border-[#e5e9f0] shadow-sm overflow-hidden flex flex-col h-fit">
          <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-5 py-3 border-b border-[#e2e8f0] shadow-[inset_0_1px_0_white] flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#f59e0b] rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
            <h3 className="text-[15px] font-black text-[#1e293b] tracking-tight">계정 설정</h3>
          </div>
          
          <div className="flex flex-col p-4 gap-3 bg-[#fbfcfd]">
            {/* Username Row */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-white to-[#f8fafc] border border-[#e2e8f0] px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="size-[28px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner">
                  <User className="size-4 text-[#64748b]" />
                </div>
                <label className="text-[13px] font-extrabold text-[#64748b] tracking-tight">아이디</label>
              </div>
              <span className="text-[14px] font-black text-[#1e293b] bg-white px-3 py-1 rounded border border-[#e2e8f0] shadow-sm">{profile.username}</span>
            </div>

            {/* Nickname Row */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-white to-[#f8fafc] border border-[#e2e8f0] px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] group hover:border-[#cbd5e1] transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-[28px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner">
                  <User className="size-4 text-[#64748b]" />
                </div>
                <label className="text-[13px] font-extrabold text-[#64748b] tracking-tight">닉네임</label>
              </div>
              {isEditingNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="h-8 w-[140px] rounded-md border border-[#cbd5e1] bg-white px-2 py-0 text-[13px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] shadow-inner"
                  />
                  <button
                    className="h-8 rounded-md bg-gradient-to-b from-[#10b981] to-[#059669] px-3 font-black text-white text-[11px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(16,185,129,0.3)] hover:-translate-y-[1px] transition-all"
                    onClick={handleSaveNickname}
                  >
                    저장
                  </button>
                  <button
                    className="h-8 rounded-md bg-white border border-[#e2e8f0] px-3 font-bold text-[#64748b] text-[11px] hover:bg-[#f1f5f9] transition-colors"
                    onClick={() => setIsEditingNickname(false)}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-[#1e293b]">{profile.nickname}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 h-7 rounded bg-white border border-[#e2e8f0] px-2 font-black text-[#3b82f6] text-[11px] hover:bg-[#f1f5f9] transition-all shadow-sm"
                    onClick={() => setIsEditingNickname(true)}
                  >
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* Phone Row */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-white to-[#f8fafc] border border-[#e2e8f0] px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)] group hover:border-[#cbd5e1] transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-[28px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner">
                  <User className="size-4 text-[#64748b]" />
                </div>
                <label className="text-[13px] font-extrabold text-[#64748b] tracking-tight">전화번호</label>
              </div>
              {isEditingPhone ? (
                <div className="flex items-center gap-2">
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-8 w-[140px] rounded-md border border-[#cbd5e1] bg-white px-2 py-0 text-[13px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] shadow-inner"
                  />
                  <button
                    className="h-8 rounded-md bg-gradient-to-b from-[#10b981] to-[#059669] px-3 font-black text-white text-[11px] shadow-[inset_0_-2px_0_rgba(0,0,0,0.1),_0_2px_4px_rgba(16,185,129,0.3)] hover:-translate-y-[1px] transition-all"
                    onClick={handleSavePhone}
                  >
                    저장
                  </button>
                  <button
                    className="h-8 rounded-md bg-white border border-[#e2e8f0] px-3 font-bold text-[#64748b] text-[11px] hover:bg-[#f1f5f9] transition-colors"
                    onClick={() => setIsEditingPhone(false)}
                  >
                    취소
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-black text-[#1e293b]">{profile.phone}</span>
                  <button
                    className="opacity-0 group-hover:opacity-100 h-7 rounded bg-white border border-[#e2e8f0] px-2 font-black text-[#3b82f6] text-[11px] hover:bg-[#f1f5f9] transition-all shadow-sm"
                    onClick={() => setIsEditingPhone(true)}
                  >
                    수정
                  </button>
                </div>
              )}
            </div>

            {/* Referral ROW */}
            <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-white to-[#fef9c3]/30 border border-[#e2e8f0] border-l-2 border-l-[#f59e0b] px-4 py-3 shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="size-[28px] rounded-lg bg-gradient-to-br from-[#fef3c7] to-[#fde68a] flex items-center justify-center border border-[#fcd34d]">
                  <Users className="size-4 text-[#b45309]" />
                </div>
                <label className="text-[13px] font-extrabold text-[#64748b] tracking-tight">추천코드</label>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[16px] font-black text-[#f59e0b] bg-white px-3 py-1 rounded shadow-inner border border-[#fef08a]">{profile.myReferralCode}</span>
                <button
                  className="h-8 px-2 rounded-md border border-[#e2e8f0] bg-white hover:bg-[#f1f5f9] shadow-sm transform hover:scale-105 transition-all text-[#64748b]"
                  onClick={handleCopyReferralCode}
                >
                  {copiedCode ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>

          {/* Action Row: Login History & PW */}
          <div className="flex flex-col sm:flex-row gap-3 mt-1">
            <Link
              href="/profile/login-history"
              className="group flex flex-1 items-center justify-between rounded-xl bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] px-4 py-3.5 shadow-sm hover:shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-[#cbd5e1] transform hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="size-[32px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
                  <History className="size-[18px]" />
                </div>
                <span className="text-[14px] font-black text-[#1e293b] tracking-tight">접속 내역 보기</span>
              </div>
              <ChevronRight className="size-5 text-[#94a3b8] group-hover:text-[#3b82f6] transition-colors" />
            </Link>

            <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
              <DialogTrigger asChild>
                <button className="group flex flex-1 items-center justify-between rounded-xl bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] px-4 py-3.5 shadow-sm hover:shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-[#cbd5e1] transform hover:-translate-y-0.5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-[32px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner group-hover:bg-[#f59e0b] group-hover:text-white transition-colors">
                      <Lock className="size-[18px]" />
                    </div>
                    <span className="text-[14px] font-black text-[#1e293b] tracking-tight">비밀번호 변경</span>
                  </div>
                  <ChevronRight className="size-5 text-[#94a3b8] group-hover:text-[#f59e0b] transition-colors" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0]">
                  <DialogTitle className="text-[18px] font-black text-[#1e293b]">비밀번호 변경</DialogTitle>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-white">
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">현재 비밀번호</label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="mt-1 h-[42px] w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[14px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">새 비밀번호</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="mt-1 h-[42px] w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[14px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
                      placeholder="8자 이상, 영문+숫자"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">새 비밀번호 확인</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1 h-[42px] w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[14px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-[13px] font-bold text-[#ef4444] bg-[#fef2f2] px-3 py-2 rounded-md border border-[#fecaca]">{passwordError}</p>
                  )}
                  <button
                    className="w-full h-[46px] rounded-xl bg-gradient-to-b from-[#4da1ff] to-[#1e6adb] text-white font-black text-[15px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(30,106,219,0.3)] hover:-translate-y-[1px] transform transition-all mt-2"
                    onClick={handleChangePassword}
                  >
                    변경하기
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Withdraw PIN Action */}
          <div className="pt-1">
            <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
              <DialogTrigger asChild>
                <button className="group flex w-full items-center justify-between rounded-xl bg-gradient-to-b from-white to-[#f1f5f9] border border-[#e2e8f0] px-4 py-3.5 shadow-sm hover:shadow-[0_4px_10px_rgba(0,0,0,0.05),_inset_0_-2px_0_rgba(0,0,0,0.02)] ring-1 ring-transparent hover:ring-[#cbd5e1] transform hover:-translate-y-0.5 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-[32px] rounded-lg bg-[#e2e8f0] flex items-center justify-center shadow-inner group-hover:bg-[#10b981] group-hover:text-white transition-colors">
                      <Lock className="size-[18px]" />
                    </div>
                    <span className="text-[14px] font-black text-[#1e293b] tracking-tight">
                      {profile.hasWithdrawPin ? '출금 PIN 변경' : '안전 출금 PIN 설정'}
                    </span>
                  </div>
                  <ChevronRight className="size-5 text-[#94a3b8] group-hover:text-[#10b981] transition-colors" />
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-0 shadow-2xl">
                <div className="bg-gradient-to-b from-[#f8fafc] to-[#f1f5f9] px-6 py-4 border-b border-[#e2e8f0]">
                  <DialogTitle className="text-[18px] font-black text-[#1e293b]">
                    {profile.hasWithdrawPin ? '출금 PIN 변경' : '출금 PIN 설정'}
                  </DialogTitle>
                </div>
                <div className="flex flex-col gap-4 p-6 bg-white">
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">계정 비밀번호 확인</label>
                    <input
                      type="password"
                      value={pinPassword}
                      onChange={(e) => setPinPassword(e.target.value)}
                      className="mt-1 h-[42px] w-full rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[14px] font-bold text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner"
                    />
                  </div>
                  {profile.hasWithdrawPin && (
                    <div>
                      <label className="text-[13px] font-bold text-[#64748b]">현재 PIN (6자리)</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={currentPin}
                        onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                        className="mt-1 h-[42px] w-full tracking-[0.5em] rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[16px] font-black text-center text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner placeholder:tracking-normal placeholder:font-bold placeholder:text-[14px]"
                        placeholder="숫자 6자리 입력"
                      />
                    </div>
                  )}
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">새 PIN (6자리)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 h-[42px] w-full tracking-[0.5em] rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[16px] font-black text-center text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner placeholder:tracking-normal placeholder:font-bold placeholder:text-[14px]"
                      placeholder="숫자 6자리 입력"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-bold text-[#64748b]">새 PIN 확인</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                      className="mt-1 h-[42px] w-full tracking-[0.5em] rounded-xl border border-[#cbd5e1] bg-[#f8fafc] px-3.5 text-[16px] font-black text-center text-[#1e293b] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 transition-all shadow-inner placeholder:tracking-normal placeholder:font-bold placeholder:text-[14px]"
                      placeholder="숫자 6자리 입력"
                    />
                  </div>
                  {pinError && (
                    <p className="text-[13px] font-bold text-[#ef4444] bg-[#fef2f2] px-3 py-2 rounded-md border border-[#fecaca]">{pinError}</p>
                  )}
                  <button
                    className="w-full h-[46px] rounded-xl bg-gradient-to-b from-[#10b981] to-[#059669] text-white font-black text-[15px] shadow-[inset_0_-3px_0_rgba(0,0,0,0.2),_0_3px_6px_rgba(16,185,129,0.3)] hover:-translate-y-[1px] transform transition-all mt-2"
                    onClick={handlePinSubmit}
                  >
                    {profile.hasWithdrawPin ? 'PIN 변경 완료' : 'PIN 설정 완료'}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
