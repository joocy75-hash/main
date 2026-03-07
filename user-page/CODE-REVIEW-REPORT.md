# user-page 종합 코드 리뷰 보고서

**리뷰일**: 2026-03-08
**대상**: user-page (backend + frontend), 40개 파일, +1,366 / -270 lines
**리뷰어**: 5개 전문 에이전트 (Backend Security, Frontend Review, Security Audit, Type Safety, Silent Failure)

---

## 종합 점수

| 영역 | 점수 | 판정 |
|------|------|------|
| 백엔드 보안 | 72/100 | 수정 필요 |
| 프론트엔드 품질 | 75/100 | 수정 필요 |
| 보안 감사 (OWASP) | 82/100 | 양호 (일부 수정) |
| 타입 안전성 | 72/100 | 수정 필요 |
| 에러 처리 | 65/100 | 수정 필요 |
| **종합** | **73/100** | **CRITICAL 수정 후 재리뷰** |

---

## 이슈 요약 (중복 제거 후)

| 등급 | 건수 | 핵심 영역 |
|------|------|-----------|
| CRITICAL | **8건** | 금전 레이스컨디션, PIN 브루트포스, 에러 시 데이터 손실, API 계약 불일치 |
| HIGH | **12건** | CSRF, 인증 누락, Mock 폴백, 에러 삼킴, 클로저 버그 |
| MEDIUM | **11건** | 파일 크기, 하드코딩, 캐시, 접근성 |
| LOW | **6건** | 네이밍, 로깅, 보안 헤더 |
| **합계** | **37건** | |

---

## CRITICAL (8건) -- 즉시 수정 필요

### C-01. 일일 출금 한도 검사가 트랜잭션 밖 (TOCTOU 레이스컨디션)
- **파일**: `backend/src/services/wallet-service.ts:286~307`
- **위험**: 동시 출금 요청으로 일일 한도를 초과하는 출금이 승인될 수 있음
- **수정**: `todayWithdrawals` 집계를 `prisma.$transaction` 블록 내부로 이동

### C-02. 출금 PIN 브루트포스 보호 없음
- **파일**: `backend/src/services/wallet-service.ts:362~367`
- **위험**: PIN 6자리(최대 100만 가지)를 무제한으로 시도 가능
- **수정**: Redis 기반 PIN 시도 횟수 카운터 + 잠금 추가 (비밀번호와 동일 패턴)

### C-03. PIN 설정/변경 엔드포인트에 Rate Limit 없음
- **파일**: `backend/src/routes/profile.ts:153~217`
- **위험**: bcrypt 연산을 무제한 호출 + PIN 오라클 공격 가능
- **수정**: `authRateLimit` (5회/분) 적용

### C-04. 출금 실패 시 상태 업데이트가 실패하면 잔액만 차감된 채 방치
- **파일**: `backend/src/services/wallet-service.ts:440~451`
- **위험**: payout API 실패 → `withdrawal.update` 실패 → 잔액 차감 + 상태 미반영 = 금전 손실
- **수정**: 상태 업데이트를 이중 try-catch로 보호 + CRITICAL 로그 추가

### C-05. 프론트 wallet-store: API 실패 시 기존 금전 데이터를 빈 배열로 덮어씀
- **파일**: `frontend/src/stores/wallet-store.ts:143,193,205,217`
- **위험**: 네트워크 오류 시 주소/거래내역/입금/출금 데이터가 화면에서 사라짐 → 사용자 패닉
- **수정**: catch에서 `set({ addresses: [] })` 제거, 기존 데이터 유지

### C-06. 게임 런칭 URL 미검증 (Open Redirect)
- **파일**: `frontend/src/components/game/game-launch-modal.tsx:73~76,91~94`
- **위험**: 악의적 URL로 사용자를 피싱 사이트로 이동시킬 수 있음
- **수정**: URL이 `https://`로 시작하는지 + 허용 도메인 화이트리스트 검증

### C-07. shared 타입과 백엔드 실제 응답 구조 불일치 (3곳)
- **파일**: `shared/types/transaction.ts:36,22`, `shared/types/api.ts:8~15`
- **상세**:
  - `Transaction.type`: shared=UPPERCASE, 백엔드=lowercase
  - `DepositRequest.amount`: shared=string, 백엔드 Zod=number
  - `PaginatedResponse`: shared=flat, 백엔드=`{ data: { items, pagination } }`
- **위험**: 향후 유지보수 시 런타임 에러 유발 (현재는 api-client 자동 언래핑으로 동작)
- **수정**: shared 타입을 실제 백엔드 응답에 맞게 통일

### C-08. .env 파일에 실제 API 키 평문 저장 + 키 로테이션 필요
- **파일**: `backend/.env`
- **위험**: Heleket/Cryptomus/Gamblly 등 실제 결제 API 키가 평문으로 존재
- **수정**: 시크릿 관리 시스템으로 이전, 현재 키 로테이션

---

## HIGH (12건) -- 1주 내 수정

### H-01. CSRF 보호가 X-Requested-With 헤더에만 의존
- **파일**: `backend/src/middleware/csrf-guard.ts:11~13`
- **수정**: Origin/Referer 헤더 검증 추가 또는 Double Submit Cookie 패턴

### H-02. PIN 미설정 사용자는 비밀번호만으로 출금 가능
- **파일**: `backend/src/services/wallet-service.ts:362`
- **수정**: PIN 미설정 시 출금 차단, PIN 설정 강제

### H-03. 게임 API 엔드포인트에 인증 없음 + `refresh=1`로 외부 API 쿼터 소진 공격
- **파일**: `backend/src/routes/games.ts`
- **수정**: `refresh=1` 파라미터를 인증된 관리자 전용으로 제한

### H-04. `/api/auth/refresh`에 rate limit 없음
- **파일**: `backend/src/routes/auth.ts:130`
- **수정**: IP당 10회/분 rate limit 추가

### H-05. PIN 설정이 비원자적 (동시 요청 시 덮어쓰기 가능)
- **파일**: `backend/src/services/profile-service.ts:152~222`
- **수정**: `updateMany({ where: { id, withdrawPin: null } })` 조건부 업데이트

### H-06. 스포츠 API 실패 시 Mock 데이터를 실제 데이터처럼 표시
- **파일**: `frontend/src/stores/sports-store.ts:196~213`, `backend/src/services/sports-service.ts:700~714`
- **수정**: "데이터 로드 실패" 안내로 변경, Mock 폴백 제거

### H-07. profile-store: 12개+ 조회 함수에서 에러 시 빈 데이터로 무조건 대체
- **파일**: `frontend/src/stores/profile-store.ts` 전체
- **수정**: 에러 시 기존 데이터 유지 + 에러 상태 설정

### H-08. auth-store: 서버 다운도 "비인증"으로 처리 → 강제 로그아웃
- **파일**: `frontend/src/stores/auth-store.ts:107~111`
- **수정**: 500/네트워크 에러와 401을 구분하여 처리

### H-09. withdrawConfig 실패 시 fee=0, dailyLimit=0 → 수수료 없이 출금 가능
- **파일**: `frontend/src/stores/wallet-store.ts:122~128`
- **수정**: config 미로드 시 출금 폼 비활성화

### H-10. 출금 페이지 isFormValid useMemo 의존성 불일치 (금전 계산 클로저)
- **파일**: `frontend/src/app/(main)/wallet/withdraw/page.tsx:82~96`
- **수정**: fee/dailyLimit를 handleSubmit 내부에서 재계산

### H-11. 게임 카드에서 외부 이미지 URL을 검증 없이 <img src>에 사용
- **파일**: `frontend/src/components/game/game-card.tsx:46~51`
- **수정**: Next.js `<Image>` + remotePatterns 화이트리스트

### H-12. 출금 설정 상수가 wallet-service.ts와 wallet.ts에 이중 관리
- **파일**: `backend/src/routes/wallet.ts:236~257`, `backend/src/services/wallet-service.ts`
- **수정**: service에서 export → route에서 import (단일 소스)

---

## MEDIUM (11건) -- 다음 스프린트

| # | 이슈 | 파일 |
|---|------|------|
| M-01 | `any` 타입 ~88곳 (백엔드 catch 46 + services 38 + routes 4) | backend 전체 |
| M-02 | 4개 파일이 300줄 초과 (sports-service 800줄 최대) | backend/src/services/ |
| M-03 | 에러 핸들링 보일러플레이트 58개 동일 catch 블록 반복 | backend/src/routes/ |
| M-04 | sports-service 인메모리 캐시에 크기 제한 없음 (메모리 누수) | backend/src/services/sports-service.ts |
| M-05 | 거래 병합 정렬이 인메모리 (type='all' 시 최대 1000건) | backend/src/services/wallet-service.ts:504 |
| M-06 | 비밀번호 변경 시 기존 세션 무효화 안 됨 | backend/src/services/profile-service.ts:123 |
| M-07 | amount 최대값 검증 누락 (극단값 오버플로우 가능) | backend/src/routes/wallet.ts:46,56 |
| M-08 | createInquiry content에 최대 길이 제한 없음 | backend/src/routes/profile.ts:58 |
| M-09 | 에러 응답에 내부 API 메시지 노출 가능 | backend/src/services/*.ts |
| M-10 | 프로필 PIN 다이얼로그 닫을 때 상태 초기화 안 됨 | frontend/src/app/(main)/profile/page.tsx |
| M-11 | payment-provider callApi 연산자 우선순위 버그 | backend/src/services/payment-provider.ts:148 |

---

## LOW (6건) -- 백로그

| # | 이슈 |
|---|------|
| L-01 | 보안 헤더 미설정 (HSTS, CSP, X-Frame-Options) |
| L-02 | Refresh Token DB 정리 메커니즘 없음 |
| L-03 | BCRYPT_ROUNDS 상수 2곳 중복 정의 |
| L-04 | 프로덕션 로그 레벨이 warn (보안 감사 추적에 info 권장) |
| L-05 | Prisma schema withdrawPin에 길이 제한 없음 (@db.VarChar(72) 권장) |
| L-06 | FlagshipBanner 소셜 링크가 href="#" (페이지 스크롤 이동) |

---

## 잘 구현된 부분

| 항목 | 상세 |
|------|------|
| HttpOnly 쿠키 인증 | JWT를 localStorage 대신 httpOnly/secure/SameSite=strict 쿠키에 저장 |
| Refresh Token Rotation | 갱신 시 이전 토큰 즉시 블랙리스트 + DB 삭제 |
| SELECT FOR UPDATE | 출금 시 잔액 행 잠금으로 원자성 보장 |
| 이중 지급 방지 | 웹훅에서 `updateMany({ where: { status: 'PENDING' } })` 원자적 상태 가드 |
| Decimal.js 도입 | 부동소수점 오류 방지를 위한 정밀 연산 |
| Zod 입력 검증 | 모든 백엔드 라우트에 스키마 검증 적용 |
| 프론트엔드 any 0건 | strict: true + 개발자 규율로 프론트엔드 any 타입 전무 |
| React 성능 최적화 | useMemo 20+곳, useCallback 15+곳, React.memo 적용 |
| 출금 비밀번호 보호 | Redis 5회 잠금 + 15분 lockout |
| 프로덕션 시크릿 강제 | 미설정 시 프로세스 시작 거부 |

---

## 수정 우선순위 (권장 순서)

### 1단계: CRITICAL (즉시, ~4시간)
1. C-01: 일일 한도 검사를 트랜잭션 내부로 이동
2. C-02: PIN 브루트포스 Redis 잠금 추가
3. C-04: 출금 실패 상태 업데이트 이중 보호
4. C-05: wallet-store 에러 시 기존 데이터 유지
5. C-06: 게임 런칭 URL 화이트리스트 검증
6. C-03: PIN 엔드포인트 authRateLimit 적용

### 2단계: HIGH (1주, ~6시간)
7. H-02: PIN 미설정 시 출금 차단
8. H-06: Mock 폴백 제거
9. H-09: withdrawConfig 실패 시 출금 폼 비활성화
10. H-08: auth initialize에서 서버 에러 구분
11. H-03: 게임 refresh 파라미터 인증
12. 나머지 HIGH 이슈

### 3단계: MEDIUM + LOW (다음 스프린트)
13. 글로벌 에러 핸들러 통합 (M-03)
14. any 타입 정리 (M-01)
15. 파일 분할 (M-02)
16. 나머지 MEDIUM/LOW

---

**판정: CRITICAL 8건 존재 → 리뷰 미통과. CRITICAL 수정 후 확인 리뷰 필요.**
