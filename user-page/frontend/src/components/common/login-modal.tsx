'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, Loader2, X } from 'lucide-react';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginModalStore } from '@/stores/login-modal-store';

const loginSchema = z.object({
  username: z.string()
    .min(1, '아이디를 입력해주세요')
    .min(4, '아이디는 4자 이상이어야 합니다'),
  password: z.string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 8자 이상이어야 합니다'),
});

export const LoginModal = () => {
  const { login } = useAuthStore();
  const { isOpen, close } = useLoginModalStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = localStorage.getItem('savedUsername');
      if (saved) {
        setUsername(saved);
        setRememberUsername(true);
      }
      setError('');
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = loginSchema.safeParse({ username: username.trim(), password });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);

    try {
      if (rememberUsername) {
        localStorage.setItem('savedUsername', username);
      } else {
        localStorage.removeItem('savedUsername');
      }

      await login(username, password);
      close();
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) close(); }}>
      <DialogContent className="max-w-[420px] border-none bg-white p-0 shadow-2xl sm:rounded-2xl">
        <DialogTitle className="sr-only">로그인</DialogTitle>

        {/* Header */}
        <div className="relative border-b border-[#f0f0f2] px-6 py-5">
          <h2 className="bg-gradient-to-r from-[#ffd651] to-[#fe960e] bg-clip-text text-center text-xl font-bold tracking-tight text-transparent">
            Game Platform
          </h2>
          <p className="mt-0.5 text-center text-sm text-[#6b7280]">로그인</p>
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 rounded-full p-1 text-[#98a7b5] hover:bg-[#f0f0f2] hover:text-[#252531]"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label htmlFor="modal-username" className="text-sm font-medium text-[#252531]">
              아이디
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
              <input
                id="modal-username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-4 text-sm text-[#252531] placeholder:text-[#999] focus:border-[#feb614] focus:outline-none"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="modal-password" className="text-sm font-medium text-[#252531]">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
              <input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#999] focus:border-[#feb614] focus:outline-none"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-[#252531]"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="modal-remember"
              checked={rememberUsername}
              onCheckedChange={(checked) => setRememberUsername(checked === true)}
            />
            <label htmlFor="modal-remember" className="cursor-pointer text-sm font-normal text-[#252531]">
              아이디 저장
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-gradient-to-r from-[#ffd651] to-[#fe960e] py-3 text-base font-bold text-black hover:opacity-90 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                로그인 중...
              </span>
            ) : (
              '로그인'
            )}
          </button>

          <p className="text-center text-sm text-[#6b7280]">
            계정이 없으신가요?{' '}
            <Link
              href="/register"
              onClick={close}
              className="font-medium text-[#feb614] hover:underline"
            >
              회원가입
            </Link>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};
