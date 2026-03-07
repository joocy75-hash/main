'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, User, Lock, Phone, Gift, Eye, EyeOff, Check, X } from 'lucide-react';
import { z } from 'zod';
import { useAuthStore } from '@/stores/auth-store';
import { useLoginModalStore } from '@/stores/login-modal-store';

const TOTAL_STEPS = 4;

const usernameSchema = z.string()
  .min(4, '4자 이상 입력해주세요')
  .max(20, '20자 이하로 입력해주세요')
  .regex(/^[a-z0-9]+$/, '영문 소문자와 숫자만 사용 가능합니다');

const passwordSchema = z.string()
  .min(8, '8자 이상 입력해주세요')
  .regex(/[a-zA-Z]/, '영문을 포함해야 합니다')
  .regex(/[0-9]/, '숫자를 포함해야 합니다');

const nicknameSchema = z.string()
  .min(2, '2자 이상 입력해주세요')
  .max(20, '20자 이하로 입력해주세요');

const phoneSchema = z.string()
  .regex(/^01[0-9]{8,9}$/, '올바른 전화번호 형식이 아닙니다 (예: 01012345678)');

const referrerCodeSchema = z.string()
  .min(1, '추천코드를 입력해주세요');

const getPasswordStrength = (password: string): { level: 'weak' | 'medium' | 'strong'; label: string } => {
  if (!password) return { level: 'weak', label: '' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 'weak', label: '약함' };
  if (score <= 3) return { level: 'medium', label: '보통' };
  return { level: 'strong', label: '강함' };
};

const strengthColors = {
  weak: 'bg-red-500',
  medium: 'bg-yellow-500',
  strong: 'bg-green-500',
};

const StepIndicator = ({ currentStep }: { currentStep: number }) => (
  <div className="mb-6 flex items-center justify-center gap-2">
    {Array.from({ length: TOTAL_STEPS }, (_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i <= currentStep
            ? 'w-8 bg-[#feb614]'
            : 'w-2 bg-[#e8e8e8]'
        }`}
      />
    ))}
  </div>
);

interface ValidationItemProps {
  valid: boolean;
  message: string;
}

const ValidationItem = ({ valid, message }: ValidationItemProps) => (
  <div className="flex items-center gap-1.5 text-xs">
    {valid ? (
      <Check className="size-3 text-green-500" />
    ) : (
      <X className="size-3 text-[#6b7280]" />
    )}
    <span className={valid ? 'text-green-500' : 'text-[#6b7280]'}>
      {message}
    </span>
  </div>
);

const RegisterPage = () => {
  const router = useRouter();
  const { register } = useAuthStore();

  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [referrerCode, setReferrerCode] = useState('');

  const usernameValidation = useMemo(() => {
    if (!username) return { valid: false, errors: [] as string[] };
    const result = usernameSchema.safeParse(username);
    return {
      valid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => e.message),
    };
  }, [username]);

  const passwordValidation = useMemo(() => {
    if (!password) return { valid: false, errors: [] as string[] };
    const result = passwordSchema.safeParse(password);
    return {
      valid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => e.message),
    };
  }, [password]);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const passwordsMatch = password === passwordConfirm && passwordConfirm.length > 0;

  const nicknameValidation = useMemo(() => {
    if (!nickname) return { valid: false, errors: [] as string[] };
    const result = nicknameSchema.safeParse(nickname);
    return {
      valid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => e.message),
    };
  }, [nickname]);

  const phoneValidation = useMemo(() => {
    if (!phone) return { valid: false, errors: [] as string[] };
    const result = phoneSchema.safeParse(phone);
    return {
      valid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => e.message),
    };
  }, [phone]);

  const referrerValidation = useMemo(() => {
    if (!referrerCode) return { valid: false, errors: [] as string[] };
    const result = referrerCodeSchema.safeParse(referrerCode);
    return {
      valid: result.success,
      errors: result.success ? [] : result.error.errors.map(e => e.message),
    };
  }, [referrerCode]);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return usernameValidation.valid;
      case 1: return passwordValidation.valid && passwordsMatch;
      case 2: return nicknameValidation.valid && phoneValidation.valid;
      case 3: return referrerValidation.valid;
      default: return false;
    }
  };

  const handleNext = () => {
    setError('');
    if (step < TOTAL_STEPS - 1 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    setError('');
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setError('');
    setIsSubmitting(true);

    try {
      await register({
        username,
        nickname,
        password,
        phone,
        referrerCode,
      });
      router.push('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : '회원가입에 실패했습니다';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (step < TOTAL_STEPS - 1) {
        handleNext();
      } else {
        handleSubmit();
      }
    }
  };

  const stepTitles = ['아이디 설정', '비밀번호 설정', '개인정보', '추천코드'];

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f1f2f7] px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <h1 className="bg-gradient-to-r from-[#ffd651] to-[#fe960e] bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            회원가입
          </h1>
          <p className="mt-1 text-base text-[#6b7280]">
            {stepTitles[step]}
          </p>
        </div>

        <StepIndicator currentStep={step} />

        <div onKeyDown={handleKeyDown}>
          {/* Step 1: Username */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-[#252531]">아이디</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="username"
                    type="text"
                    placeholder="영문 소문자 + 숫자, 4~20자"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                {username && (
                  <div className="mt-2 space-y-1">
                    <ValidationItem
                      valid={username.length >= 4 && username.length <= 20}
                      message="4~20자"
                    />
                    <ValidationItem
                      valid={/^[a-z0-9]*$/.test(username)}
                      message="영문 소문자 + 숫자만"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Password */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-[#252531]">비밀번호</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="8자 이상, 영문 + 숫자"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    autoComplete="new-password"
                    autoFocus
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

                {password && (
                  <>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex flex-1 gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              i === 0
                                ? strengthColors[passwordStrength.level]
                                : i === 1 && (passwordStrength.level === 'medium' || passwordStrength.level === 'strong')
                                  ? strengthColors[passwordStrength.level]
                                  : i === 2 && passwordStrength.level === 'strong'
                                    ? strengthColors[passwordStrength.level]
                                    : 'bg-[#e8e8e8]'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.label && (
                        <span className={`text-xs font-medium ${
                          passwordStrength.level === 'weak' ? 'text-red-500'
                            : passwordStrength.level === 'medium' ? 'text-yellow-500'
                              : 'text-green-500'
                        }`}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-1">
                      <ValidationItem valid={password.length >= 8} message="8자 이상" />
                      <ValidationItem valid={/[a-zA-Z]/.test(password)} message="영문 포함" />
                      <ValidationItem valid={/[0-9]/.test(password)} message="숫자 포함" />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="passwordConfirm" className="text-sm font-medium text-[#252531]">비밀번호 확인</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? 'text' : 'password'}
                    placeholder="비밀번호를 다시 입력하세요"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280] transition-colors hover:text-[#252531]"
                    tabIndex={-1}
                  >
                    {showPasswordConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {passwordConfirm && (
                  <ValidationItem
                    valid={passwordsMatch}
                    message={passwordsMatch ? '비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
                  />
                )}
              </div>
            </div>
          )}

          {/* Step 3: Personal Info */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="nickname" className="text-sm font-medium text-[#252531]">닉네임</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="nickname"
                    type="text"
                    placeholder="2~20자"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    autoFocus
                  />
                </div>
                {nickname && !nicknameValidation.valid && (
                  <p className="text-xs text-red-500">{nicknameValidation.errors[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-[#252531]">전화번호</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="01012345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    maxLength={11}
                  />
                </div>
                {phone && !phoneValidation.valid && (
                  <p className="text-xs text-red-500">{phoneValidation.errors[0]}</p>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Referrer Code */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="referrerCode" className="text-sm font-medium text-[#252531]">
                  추천코드 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#6b7280]" />
                  <input
                    id="referrerCode"
                    type="text"
                    placeholder="추천코드를 입력하세요"
                    value={referrerCode}
                    onChange={(e) => setReferrerCode(e.target.value)}
                    className="h-11 w-full rounded-lg border border-[#e8e8e8] bg-[#f5f5f7] pl-10 pr-10 text-sm text-[#252531] placeholder:text-[#666] focus:border-[#feb614] focus:outline-none"
                    autoFocus
                  />
                </div>
                {referrerCode ? (
                  <p className="text-xs text-green-500">
                    추천코드가 입력되었습니다
                  </p>
                ) : (
                  <p className="text-xs text-[#6b7280]">
                    추천코드는 필수 입력 항목입니다
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}

          {/* Navigation Buttons */}
          <div className="mt-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#e8e8e8] bg-[#f0f0f2] py-3 text-base font-medium text-[#252531] hover:border-[#feb614] disabled:opacity-50"
                disabled={isSubmitting}
              >
                <ArrowLeft className="size-4" />
                이전
              </button>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ffd651] to-[#fe960e] py-3 text-base font-bold text-black hover:opacity-90 disabled:opacity-50"
                disabled={!canProceed()}
              >
                다음
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#ffd651] to-[#fe960e] py-3 text-base font-bold text-black hover:opacity-90 disabled:opacity-50"
                disabled={!canProceed() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  '가입하기'
                )}
              </button>
            )}
          </div>

          <p className="mt-4 text-center text-sm text-[#6b7280]">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={() => useLoginModalStore.getState().open()}
              className="font-medium text-[#feb614] hover:underline"
            >
              로그인
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
