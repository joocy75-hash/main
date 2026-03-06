'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuthStore } from '@/stores/auth-store';

const loginSchema = z.object({
  username: z.string()
    .min(1, '아이디를 입력해주세요')
    .min(4, '아이디는 4자 이상이어야 합니다'),
  password: z.string()
    .min(1, '비밀번호를 입력해주세요')
    .min(8, '비밀번호는 8자 이상이어야 합니다'),
});

const LoginPage = () => {
  const router = useRouter();
  const { login, isAuthenticated, initialize } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberUsername, setRememberUsername] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initialize();
    const saved = localStorage.getItem('savedUsername');
    if (saved) {
      setUsername(saved);
      setRememberUsername(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

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
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f2f3f7] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-[#ffd651] to-[#fe960e] bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Game Platform
          </h1>
          <p className="mt-1 text-base text-[#6b7280]">
            로그인
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-[#252531]">
              아이디
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
              <input
                id="username"
                type="text"
                placeholder="아이디를 입력하세요"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-[#252531]">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-[#252531]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="remember"
              checked={rememberUsername}
              onCheckedChange={(checked) => setRememberUsername(checked === true)}
            />
            <label htmlFor="remember" className="cursor-pointer text-sm font-normal text-[#252531]">
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

          <p className="text-center text-sm text-[#6b7280] mt-4">
            계정이 없으신가요?{' '}
            <Link
              href="/register"
              className="font-medium text-[#feb614] hover:underline"
            >
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
