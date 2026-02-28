# user-page 코드 리뷰 & 디버깅 진행상황

> **작성일**: 2026-02-28
> **상태**: 전체 완료 (CRITICAL 5/5, HIGH 8/8, MEDIUM 13/13, FH-5 아키텍처 전환 완료)

## 코드 리뷰 결과 요약

### 백엔드 (25개 파일 전수 검토)

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 3 | ✅ 전체 완료 |
| HIGH | 3 | ✅ 전체 완료 |
| MEDIUM | 7 | ✅ 전체 완료 |

**CRITICAL (즉시 수정 필수)**
- [x] C-1: `event-service.ts` grantReward() - SELECT FOR UPDATE 추가 완료 ✅
- [x] C-2: `wallet-service.ts` createWithdrawal - 비밀번호 검증을 트랜잭션 내부로 이동 완료 ✅
- [x] C-3: `schema.prisma` MoneyLog/PointLog referenceId에 UNIQUE 제약 추가 완료 ✅

**HIGH**
- [x] H-1: SpinLog에 @@index([userId, spinDate]) 추가 완료 ✅
- [x] H-2: addAddress를 $transaction으로 래핑 완료 ✅
- [x] H-3: 프로모션 claim 시 depositId 연결 + 중복 보너스 방지 완료 ✅

**MEDIUM (2차 리뷰 세션에서 전체 수정 완료)**
- [x] M-1: `event-service.ts` grantReward `source: string` → `PointLogType` enum, `as any` 제거 ✅
- [x] M-2: `event-service.ts` referenceId `Date.now()` → `randomUUID()` 변경 (4곳) ✅
- [x] M-3: `wallet.ts` 출금 성공 응답 `reply.send()` → `reply.code(201).send()` ✅
- [x] M-4: `auth-service.ts` 추천코드 생성 while 루프에 MAX_REFERRAL_CODE_ATTEMPTS(10) 가드 추가 ✅
- [x] M-5: `wallet-service.ts` getTransactions type='all' maxTake=500 하드캡 추가 ✅
- [x] M-6: `wallet-service.ts` createWithdrawal 트랜잭션 내 중복 null 체크 제거 ✅ (2차 리뷰 발견)
- [x] M-7: `wallet-service.ts` createWithdrawal parseFloat → Prisma.Decimal 비교 ✅ (2차 리뷰 발견)

### 프론트엔드 (68개 파일 전수 검토)

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 2 | ✅ 전체 완료 |
| HIGH | 5 | ✅ 전체 완료 |
| MEDIUM | 6 | ✅ 전체 완료 |

**CRITICAL (즉시 수정 필수)**
- [x] FC-1: `auth-store.ts` initialize/onRefreshed에서 /api/profile 호출하여 user 복원 완료 ✅
- [x] FC-2: `utils.ts`에 formatAmount 유틸리티 추가 완료 ✅

**HIGH**
- [x] FH-1: `middleware.ts` — 쿠키 기반 서버사이드 인증 보호 구현 완료 ✅
- [x] FH-2: `wallet-store.ts` fetchBalance 에러 상태(balanceError) 추가 완료 ✅
- [x] FH-3: `(main)/layout.tsx`에 AuthGuard 래핑 완료 ✅
- [x] FH-4: deleteAddress IDOR — 백엔드에서 이미 소유자 검증 구현됨 (실제 위험 낮음) ✅
- [x] FH-5: HttpOnly 쿠키 인증 전환 완료 ✅ (3차 세션)

**MEDIUM (2차 리뷰 세션에서 전체 수정 완료)**
- [x] FM-1: `login/page.tsx` Zod loginSchema 추가 (username min4, password min8) ✅
- [x] FM-2: `wallet-store.ts` `as unknown as Deposit[]` → `Transaction[]` 타입 정리 ✅
- [x] FM-3: `auth-store.ts` initialize() 중복 호출 방지 플래그 추가 ✅
- [x] FM-4: `api-client.ts` clearAuth `window.location.href='/login'` 제거, AuthGuard 위임 ✅
- [x] 추가: `auth-store.ts` profile fetch 실패 시 인증 상태 완전 정리 ✅ (2차 리뷰 발견)
- [x] 추가: `wallet-store.ts` console.error 제거 ✅ (2차 리뷰 발견)

## 칭찬할 점 (잘 구현된 부분)
- 출금 트랜잭션: SELECT FOR UPDATE + 원자적 잔액 차감 + MoneyLog 단일 트랜잭션
- 포인트 전환: SELECT FOR UPDATE + 이중 로그 단일 트랜잭션
- 인증: Refresh Token Rotation + 양쪽 블랙리스트 + 로그인 잠금
- Zod 입력 검증: 모든 라우트 적용, 코인-네트워크 조합/주소 regex
- 스핀 동시성: Redis INCR + DB count 이중 검증 + 실패 시 rollback
- 미션 claim: CAS 패턴으로 이중 지급 방지

## 잔여 작업

없음 — 전체 코드 리뷰 이슈 해결 완료.

기존 `sports-service.ts`에 TS 타입 에러 2건이 있으나 이번 리뷰 범위 밖의 기존 코드.

---

## 수정 이력

### 1차 세션 (CRITICAL + HIGH)
- C-1~C-3, H-1~H-3, FC-1~FC-2, FH-2~FH-3 수정
- Prisma 마이그레이션 (idempotency + index)

### 2차 세션 (MEDIUM 전체)
- 백엔드 M-1~M-7 (7건), 프론트엔드 FM-1~FM-4 + 추가 2건 (6건)
- Opus 4.6 에이전트 2팀 병렬 코드 리뷰로 M-6, M-7, 추가 이슈 발견

### 3차 세션 (FH-5: HttpOnly 쿠키 아키텍처 전환)
- **목적**: localStorage 토큰 → HttpOnly 쿠키로 XSS 토큰 탈취 방지
- **백엔드 변경**:
  - `@fastify/cookie` 패키지 추가 및 등록
  - `config.ts`: 쿠키 설정 (httpOnly, secure, sameSite:lax) 추가
  - `plugins/auth.ts`: @fastify/jwt에 cookie 옵션 추가, 블랙리스트 체크 쿠키 지원
  - `routes/auth.ts`: login/register/refresh에 `setAuthCookies()`, logout에 `clearAuthCookies()` 적용
  - refresh 엔드포인트: 쿠키 또는 body에서 refreshToken 읽기 (하위 호환)
  - logout 엔드포인트: 쿠키에서 토큰 읽기 + 쿠키 삭제
- **프론트엔드 변경**:
  - `api-client.ts`: `credentials: 'include'` 추가, localStorage/Authorization 헤더 제거
  - `auth-store.ts`: localStorage 토큰 관리 전체 제거, /api/profile 기반 인증 확인
  - `middleware.ts`: 쿠키 기반 서버사이드 인증 보호 (미인증 → /login 리다이렉트)
  - `withdraw/page.tsx`: `Withdrawal` → `Transaction` 타입 참조 수정
- **보안 효과**:
  - XSS로 인한 토큰 탈취 불가 (HttpOnly)
  - 서버사이드 라우트 보호 가능 (middleware.ts)
  - CSRF 방어: SameSite=Lax + CORS 오리진 제한
