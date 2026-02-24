'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Gem,
  Clock,
  Users,
  Mail,
  Headset,
  Lock,
  ChevronRight,
} from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useProfileStore } from '@/stores/profile-store';

const VIP_NAMES: Record<number, { name: string; icon: string }> = {
  1: { name: '브론즈', icon: '🥉' },
  2: { name: '실버', icon: '🥈' },
  3: { name: '골드', icon: '🥇' },
  4: { name: '플래티넘', icon: '💎' },
  5: { name: '다이아몬드', icon: '👑' },
  6: { name: '마스터', icon: '🏆' },
  7: { name: '그랜드마스터', icon: '⭐' },
  8: { name: '챔피언', icon: '🌟' },
  9: { name: '레전드', icon: '🔱' },
  10: { name: '미소시아', icon: '✨' },
};

const formatAmount = (value: string) =>
  new Intl.NumberFormat('ko-KR').format(Number(value));

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

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

const QUICK_LINKS = [
  { name: '베팅내역', href: '/profile/bets', icon: FileText },
  { name: '머니내역', href: '/profile/money', icon: DollarSign },
  { name: '포인트내역', href: '/promotions/points', icon: Gem },
  { name: '접속내역', href: '/profile/login-history', icon: Clock },
  { name: '추천/커미션', href: '/affiliate', icon: Users },
  { name: '쪽지함', href: '/messages', icon: Mail },
  { name: '고객센터', href: '/support', icon: Headset },
];

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

  useEffect(() => {
    fetchProfile();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile) {
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

  if (!profile) return null;

  const vipData = VIP_NAMES[profile.vipLevel] || VIP_NAMES[1];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span>👤</span> 마이페이지
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Basic info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Username */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">아이디</Label>
            <span className="text-sm font-medium">{profile.username}</span>
          </div>

          {/* Nickname */}
          <div className="flex items-center justify-between gap-2">
            <Label className="shrink-0 text-sm text-muted-foreground">닉네임</Label>
            {isEditingNickname ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="h-8 w-32"
                />
                <Button size="sm" variant="default" onClick={handleSaveNickname}>
                  저장
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNickname(false)}>
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{profile.nickname}</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingNickname(true)}>
                  수정
                </Button>
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between gap-2">
            <Label className="shrink-0 text-sm text-muted-foreground">전화번호</Label>
            {isEditingPhone ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="h-8 w-36"
                />
                <Button size="sm" variant="default" onClick={handleSavePhone}>
                  저장
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingPhone(false)}>
                  취소
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{profile.phone}</span>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingPhone(true)}>
                  수정
                </Button>
              </div>
            )}
          </div>

          {/* Join date */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">가입일</Label>
            <span className="text-sm">{formatDate(profile.createdAt)}</span>
          </div>

          {/* Last login */}
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">마지막 접속</Label>
            <span className="text-sm">{formatDateTime(profile.lastLoginAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* VIP and balance */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-4">
          {/* VIP */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{vipData.icon}</span>
            <div>
              <p className="text-sm font-bold">
                VIP: {vipData.name} (Lv.{profile.vipLevel})
              </p>
            </div>
          </div>

          <Separator />

          {/* Balance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">잔액</p>
              <p className="text-lg font-bold text-primary">{formatAmount(profile.balance)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">포인트</p>
              <p className="text-lg font-bold text-yellow-400">{formatAmount(profile.points)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password change */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Lock className="size-4" />
            비밀번호 변경
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 변경</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-sm">현재 비밀번호</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">새 비밀번호</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1"
                placeholder="8자 이상, 영문+숫자"
              />
            </div>
            <div>
              <Label className="text-sm">새 비밀번호 확인</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1"
              />
            </div>
            {passwordError && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}
            <Button onClick={handleChangePassword}>변경하기</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick links */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">바로가기</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            {QUICK_LINKS.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-md px-3 py-2.5 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="text-sm">{link.name}</span>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
