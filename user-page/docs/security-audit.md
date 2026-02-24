# 보안 감사 보고서 (Security Audit Report)

> **감사일**: 2026-02-24
> **대상**: user-page (Fastify Backend + Next.js Frontend)
> **감사자**: Claude Opus 4.6
> **결과**: 8 PASS / 2 WARNING / 0 FAIL

---

## 보안 체크리스트 결과

### 1. API Key 환경변수 관리

**결과**: ✅ PASS

- `JWT_SECRET`은 `.env` 파일에서 환경변수로 관리됨
- `backend/src/config.ts`에서 `process.env.JWT_SECRET`으로 로드
- 코드에 하드코딩된 API Key 없음
- `ADMIN_SERVICE_TOKEN`도 환경변수로 관리됨

**검증 파일**:
- `backend/src/config.ts` (line 9): `process.env.JWT_SECRET || 'dev-jwt-secret-...'`
- `.env`: `JWT_SECRET=dev-jwt-secret-change-in-production`

---

### 2. CORS 설정

**결과**: ⚠️ WARNING

- 현재 `localhost:3002`, `localhost:3001`만 허용 (개발 환경)
- `credentials: true` 설정으로 쿠키/인증 헤더 허용
- **프로덕션 배포 시 반드시 실제 도메인으로 변경 필요**

**검증 파일**:
- `backend/src/plugins/cors.ts` (line 7): `origin: ['http://localhost:3002', 'http://localhost:3001']`

**권장 조치**:
```typescript
origin: process.env.NODE_ENV === 'production'
  ? ['https://your-domain.com']
  : ['http://localhost:3002', 'http://localhost:3001'],
```

---

### 3. Rate Limit 설정

**결과**: ✅ PASS

- IP 기반 100 req/min Rate Limit 적용
- `@fastify/rate-limit` 플러그인 사용
- 한국어 에러 메시지 반환
- 키 생성자: `request.ip` (IP 기반)

**검증 파일**:
- `backend/src/middleware/rate-limit.ts` (line 7-8): `max: 100`, `timeWindow: '1 minute'`

**보완 제안**: 로그인 실패에 대한 별도 Rate Limit도 구현되어 있음 (5회 실패 시 15분 잠금, `auth-service.ts`의 `incrementFailedAttempts`)

---

### 4. SQL Injection 방지

**결과**: ✅ PASS

- **Prisma ORM** 사용으로 기본적으로 파라미터 바인딩 적용
- Raw Query 2건 존재하나, 모두 **Prisma tagged template literal** 사용 (안전)
  - `wallet-service.ts:196`: `$queryRaw` with tagged template (SELECT FOR UPDATE)
  - `event-service.ts:727`: `$queryRaw` with tagged template (SELECT FOR UPDATE)
- 문자열 연결 방식의 SQL 쿼리 없음

**검증 파일**:
- `backend/src/services/wallet-service.ts` (line 196)
- `backend/src/services/event-service.ts` (line 727)

---

### 5. XSS 방지

**결과**: ✅ PASS

- **React 기본 이스케이핑**: JSX에서 자동으로 HTML 엔티티 이스케이핑
- 직접 HTML 삽입 코드 없음 (전체 코드베이스 검색 결과)
- **사용자 입력 검증**: Zod 스키마로 모든 POST 라우트에 입력 검증 적용
  - `registerSchema`: username regex, nickname 길이 제한, phone 형식
  - `depositSchema`: coinType/network enum, amount 양수 제한
  - `withdrawSchema`: address, amount, password 검증
  - `createInquirySchema`: title 200자 제한, content 필수

**검증 파일**:
- `backend/src/routes/auth.ts` (line 5-24): registerSchema
- `backend/src/routes/wallet.ts` (line 8-27): addAddress/deposit/withdraw 스키마
- `backend/src/routes/profile.ts` (line 10-48): updateProfile/changePassword/createInquiry 스키마
- `frontend/src/lib/api-client.ts`: 프론트엔드 API 클라이언트는 JSON만 사용

---

### 6. JWT 시크릿 강도

**결과**: ⚠️ WARNING

- 현재 기본값: `'dev-jwt-secret-change-in-production'`
- 개발 환경에서는 fallback으로 사용되고 있음
- `.env` 파일에도 동일한 개발용 시크릿 설정됨
- **프로덕션 배포 시 반드시 강력한 랜덤 시크릿으로 변경 필요**

**검증 파일**:
- `backend/src/config.ts` (line 9): `process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production'`
- `.env`: `JWT_SECRET=dev-jwt-secret-change-in-production`

**권장 조치**:
```bash
# 프로덕션 시크릿 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
- 최소 256비트 (32바이트) 이상 랜덤 문자열 사용 권장
- 환경변수가 미설정 시 서버 시작 실패하도록 변경 권장:
```typescript
jwt: {
  secret: process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET required');
    return 'dev-jwt-secret-change-in-production';
  })(),
},
```

---

### 7. 비밀번호 해싱

**결과**: ✅ PASS

- **bcryptjs** 라이브러리 사용 (순수 JavaScript 구현, 호환성 우수)
- **Salt Rounds: 10** (표준 권장 수준)
- 회원가입 시 `hash(input.password, BCRYPT_ROUNDS)`로 해싱
- 로그인 시 `compare(input.password, user.passwordHash)`로 검증
- 출금 시에도 비밀번호 검증 적용 (`wallet-service.ts:183`)
- 비밀번호 변경 시 현재 비밀번호 검증 후 새 비밀번호 해싱

**검증 파일**:
- `backend/src/services/auth-service.ts` (line 2-3, 9): bcryptjs import, BCRYPT_ROUNDS = 10
- `backend/src/services/auth-service.ts` (line 61): `hash(input.password, BCRYPT_ROUNDS)`
- `backend/src/services/auth-service.ts` (line 184): `compare(input.password, user.passwordHash)`
- `backend/src/services/wallet-service.ts` (line 183): 출금 시 비밀번호 검증

---

### 8. 입력 검증 (Zod 스키마)

**결과**: ✅ PASS

모든 POST 라우트에 Zod 스키마 검증 적용:

| 라우트 | Zod 스키마 | 검증 항목 |
|--------|-----------|-----------|
| POST /api/auth/register | `registerSchema` | username regex, nickname 길이, password 강도, phone 형식, referrerCode 필수 |
| POST /api/auth/login | `loginSchema` | username/password 필수 |
| POST /api/auth/refresh | `refreshSchema` | refreshToken 필수 |
| POST /api/auth/logout | `logoutSchema` | refreshToken optional |
| POST /api/wallet/deposit | `depositSchema` | coinType enum, network enum, amount > 0 |
| POST /api/wallet/withdraw | `withdrawSchema` | coinType, network, address, amount, password |
| POST /api/wallet/addresses | `addAddressSchema` | coinType, network, address, label 50자 제한 |
| POST /api/attendance/check-in | (body 불필요) | userId from JWT |
| POST /api/missions/:id/claim | (param 검증) | missionId parseInt + isNaN 체크 |
| POST /api/spin/execute | (body 불필요) | userId from JWT |
| POST /api/promotions/:id/claim | (param 검증) | promotionId parseInt |
| POST /api/points/convert | `convertSchema` | amount >= 100 정수 |
| POST /api/games/launch | `launchSchema` | gameId 필수, platform 1-2 |
| POST /api/games/demo | `demoSchema` | gameId 필수, platform 1-2 |
| PUT /api/profile | `updateProfileSchema` | nickname 2-20, phone regex |
| POST /api/profile/password | `changePasswordSchema` | currentPassword, newPassword 강도 |
| POST /api/inquiries | `createInquirySchema` | title 200자, content 필수 |

GET 라우트에도 쿼리 파라미터 검증 적용 (page/limit/status/type 등).

---

### 9. 인증 가드 (fastify.authenticate)

**결과**: ✅ PASS

**보호 라우트 (인증 필요)**: 39개 라우트에 `preHandler: [fastify.authenticate]` 적용
- `/api/auth/logout` - 로그아웃
- `/api/wallet/*` - 지갑/입출금 전체 (8개)
- `/api/attendance/*` - 출석체크 (2개)
- `/api/missions/*` - 미션 (2개)
- `/api/spin/*` - 스핀 (2개)
- `/api/promotions/:id/claim` - 프로모션 참여
- `/api/vip/info` - VIP 정보
- `/api/points/*` - 포인트 (2개)
- `/api/games/launch` - 게임 런칭
- `/api/games/recent` - 최근 플레이
- `/api/profile/*` - 프로필 전체 (3개)
- `/api/affiliate/*` - 추천/커미션 (4개)
- `/api/messages/*` - 쪽지 (4개)
- `/api/inquiries/*` - 문의 (3개)

**공개 라우트 (인증 불필요)**: 적절하게 공개 설정
- `/health`, `/api` - 헬스체크
- `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh` - 인증 전 필요
- `/api/games/categories`, `/api/games/providers`, `/api/games/search`, `/api/games/popular` - 게임 목록 (로비 표시용)
- `/api/games/demo` - 데모 게임 (비회원 체험)
- `/api/promotions` - 프로모션 목록 (마케팅용)
- `/api/vip/levels` - VIP 등급 정보 (마케팅용)
- `/api/sports/*`, `/api/esports/*` - 스포츠 데이터 (공개 정보)

---

### 10. .env 파일 보호

**결과**: ✅ PASS

- `.gitignore`에 `.env`, `.env.local`, `.env.production` 모두 포함
- `.env` 파일에 민감 정보 포함: DB URL, Redis URL, JWT Secret, Admin Service Token
- 계획서에 `.env.example` 템플릿 존재

**검증 파일**:
- `.gitignore` (line 7-9): `.env`, `.env.local`, `.env.production`

---

## 종합 평가

| # | 항목 | 결과 | 비고 |
|---|------|------|------|
| 1 | API Key 환경변수 | ✅ PASS | 하드코딩 없음 |
| 2 | CORS 설정 | ⚠️ WARNING | 프로덕션 도메인 제한 필요 |
| 3 | Rate Limit | ✅ PASS | 100 req/min + 로그인 잠금 |
| 4 | SQL Injection | ✅ PASS | Prisma 파라미터 바인딩 |
| 5 | XSS 방지 | ✅ PASS | React 이스케이핑 + Zod 검증 |
| 6 | JWT 시크릿 강도 | ⚠️ WARNING | 프로덕션 시크릿 변경 필요 |
| 7 | 비밀번호 해싱 | ✅ PASS | bcryptjs, 10 rounds |
| 8 | 입력 검증 | ✅ PASS | 모든 POST 라우트 Zod 적용 |
| 9 | 인증 가드 | ✅ PASS | 39개 보호 라우트 확인 |
| 10 | .env 파일 | ✅ PASS | .gitignore 포함 |

### 보안 점수: 90/100

- PASS 8개 x 10점 = 80점
- WARNING 2개 x 5점 = 10점
- FAIL 0개 x 0점 = 0점

---

## 프로덕션 배포 전 필수 조치 사항

1. **JWT_SECRET 강화**: 최소 64자 랜덤 문자열로 변경
2. **CORS origin**: 실제 프로덕션 도메인으로 제한
3. **NODE_ENV=production**: 환경변수 반드시 설정
4. **DATABASE_URL**: 프로덕션 DB 크리덴셜로 변경 (강력한 비밀번호)
5. **HTTPS 강제**: Nginx 리버스 프록시에서 HTTPS 리다이렉트 설정
6. **CSP 헤더**: Content-Security-Policy 헤더 추가 권장

---

## 추가 발견 사항 (테스트 중 수정)

### 수정 완료: Refresh Token 고유성 문제

**문제**: 동일한 사용자가 짧은 시간 내 여러 번 로그인 시, JWT 토큰이 동일하게 생성되어 `refreshToken` 테이블의 unique constraint 위반 발생

**원인**: JWT payload에 고유 식별자(jti) 없이 `{userId, username, type}` 만으로 토큰 생성. 동일 초(second)에 동일 payload = 동일 토큰

**수정**: `auth-service.ts`의 `generateTokenPair` 메서드에 `randomBytes(16)`을 사용한 `jti` (JWT ID) 추가로 토큰 고유성 보장

**수정 파일**: `backend/src/services/auth-service.ts` (line 1, 336-345)
