# 유저페이지 구현 계획서 (User Page Implementation Plan)

> **작성일**: 2026-02-24
> **작성자**: Opus 4.6 Senior Dev Lead (Anthropic)
> **상태**: Phase 0~9 전체 완료 (2026-02-24)
> **기술 스택**: Next.js 16 + Fastify + TypeScript + Prisma + PostgreSQL 16
> **목표**: 관리자페이지와 완벽히 연동되는 유저용 게임 플랫폼

---

## 0. 프로젝트 개요

### 0-1. 아키텍처 전체 구조

```
┌─────────────────────────────────────────────────────────────┐
│                    유저 브라우저                               │
│                 (Next.js 16 SSR/CSR)                        │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────────────────────────────┐
│              유저 백엔드 (Fastify + TypeScript)               │
│              포트: 8003 | Prisma ORM                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ 인증     │ │ 게임     │ │ 지갑     │ │ 이벤트   │       │
│  │ JWT+Redis│ │ 프록시   │ │ 입출금   │ │ 보상     │       │
│  └──────────┘ └────┬─────┘ └──────────┘ └──────────┘       │
└─────────────────────┼───────────────────────────────────────┘
                      │ Internal API (서비스 토큰)
┌─────────────────────▼───────────────────────────────────────┐
│              관리자 백엔드 (FastAPI + Python)                  │
│              포트: 8002 | RapidAPI 프록시                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Casino   │ │ Sports   │ │ Quota    │                    │
│  │ Connector│ │ Connector│ │ Manager  │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────────┐
│                    RapidAPI                                   │
│  Casino(100+ 프로바이더) | Odds Feed | SportAPI7             │
└─────────────────────────────────────────────────────────────┘
```

### 0-2. 기술 스택 상세

| 레이어 | 기술 | 버전 | 선택 이유 |
|--------|------|------|-----------|
| **Frontend** | Next.js (App Router) | 16 | 관리자 패널 동일, SSR/CSR 하이브리드 |
| | React | 19 | React Compiler 지원 |
| | TypeScript | 5.7+ | 타입 안전성 |
| | TailwindCSS | 4 | 관리자 패널 동일 스타일 시스템 |
| | Zustand | latest | 경량 상태 관리 |
| **Backend** | Fastify | latest | 최고 성능 Node.js 프레임워크 |
| | TypeScript | 5.7+ | 프론트엔드와 타입 공유 |
| | Prisma | latest | 타입 안전 ORM, 자동 마이그레이션 |
| **DB** | PostgreSQL | 16 | 관리자 DB와 독립 (포트 5435) |
| | Redis | 7 | 세션, 캐시, Rate Limit (포트 6381) |
| **인프라** | Docker Compose | - | 개발/프로덕션 분리 |
| | Nginx | - | 리버스 프록시 + SSL |

### 0-3. 포트 매핑 (충돌 방지)

| 서비스 | 관리자 패널 | 유저 페이지 |
|--------|-------------|-------------|
| PostgreSQL | 5433 | **5435** |
| Redis | 6379 | **6381** |
| Backend | 8002 | **8003** |
| Frontend | 3001 | **3002** |

### 0-4. 디렉토리 구조 (최종 목표)

```
/Users/mr.joo/Desktop/관리자페이지/user-page/
├── docker-compose.yml              # DB + Redis
├── docker-compose.prod.yml         # 프로덕션 전체
├── .env                            # 환경변수
├── .env.example                    # 환경변수 템플릿
├── package.json                    # 모노레포 루트
├── turbo.json                      # Turborepo 설정
├── shared/                         # 프론트+백엔드 공용
│   └── types/                      # 공유 TypeScript 타입
│       ├── user.ts
│       ├── game.ts
│       ├── transaction.ts
│       ├── promotion.ts
│       └── api.ts                  # ApiResponse, PaginatedResponse
├── backend/                        # Fastify + Prisma
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── prisma/
│   │   ├── schema.prisma           # DB 스키마
│   │   ├── seed.ts                 # 시드 데이터
│   │   └── migrations/
│   └── src/
│       ├── index.ts                # Fastify 앱 진입점
│       ├── config.ts               # 환경변수 설정
│       ├── plugins/                # Fastify 플러그인
│       │   ├── auth.ts             # JWT 인증 플러그인
│       │   ├── redis.ts            # Redis 연결
│       │   ├── prisma.ts           # Prisma 클라이언트
│       │   └── cors.ts             # CORS 설정
│       ├── routes/                 # API 라우트
│       │   ├── auth.ts             # 인증 (로그인/회원가입/리프레시)
│       │   ├── user.ts             # 유저 프로필
│       │   ├── game.ts             # 게임 (관리자 프록시)
│       │   ├── wallet.ts           # 지갑/입출금
│       │   ├── sports.ts           # 스포츠 (관리자 프록시)
│       │   ├── promotion.ts        # 프로모션/이벤트
│       │   ├── attendance.ts       # 출석체크
│       │   ├── spin.ts             # 럭키스핀
│       │   ├── mission.ts          # 미션
│       │   ├── affiliate.ts        # 추천/커미션
│       │   ├── message.ts          # 쪽지
│       │   ├── inquiry.ts          # 문의
│       │   └── health.ts           # 헬스체크
│       ├── services/               # 비즈니스 로직
│       │   ├── auth-service.ts
│       │   ├── game-proxy.ts       # 관리자 백엔드 프록시
│       │   ├── wallet-service.ts
│       │   ├── reward-service.ts
│       │   ├── affiliate-service.ts
│       │   └── message-service.ts
│       ├── middleware/              # 미들웨어
│       │   ├── auth-guard.ts       # JWT 검증
│       │   └── rate-limit.ts       # Rate Limit
│       └── utils/                  # 유틸리티
│           ├── jwt.ts
│           ├── bcrypt.ts
│           └── admin-api.ts        # 관리자 백엔드 HTTP 클라이언트
├── frontend/                       # Next.js 16
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── Dockerfile
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/                    # App Router 페이지
│       │   ├── layout.tsx          # 루트 레이아웃
│       │   ├── page.tsx            # 랜딩/메인
│       │   ├── globals.css         # TailwindCSS
│       │   ├── (auth)/             # 인증 그룹
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   └── (main)/             # 인증 필요 그룹
│       │       ├── layout.tsx      # 메인 레이아웃 (Header+Footer+Sidebar)
│       │       ├── page.tsx        # 대시보드/메인 로비
│       │       ├── games/          # 게임 로비
│       │       │   ├── page.tsx    # 전체 게임
│       │       │   └── [category]/page.tsx  # 카테고리별
│       │       ├── sports/         # 스포츠
│       │       │   ├── page.tsx    # 라이브 스포츠
│       │       │   └── esports/page.tsx
│       │       ├── wallet/         # 지갑
│       │       │   ├── deposit/page.tsx
│       │       │   ├── withdraw/page.tsx
│       │       │   └── history/page.tsx
│       │       ├── promotions/     # 프로모션
│       │       │   ├── page.tsx    # 프로모션 허브
│       │       │   ├── vip/page.tsx
│       │       │   ├── attendance/page.tsx
│       │       │   ├── spin/page.tsx
│       │       │   └── missions/page.tsx
│       │       ├── affiliate/      # 추천/커미션
│       │       │   └── page.tsx
│       │       ├── profile/        # 마이페이지
│       │       │   ├── page.tsx
│       │       │   └── settings/page.tsx
│       │       ├── messages/       # 쪽지
│       │       │   └── page.tsx
│       │       └── support/        # 고객센터
│       │           └── page.tsx
│       ├── components/             # 컴포넌트
│       │   ├── ui/                 # 기본 UI (shadcn/ui)
│       │   ├── layout/            # Header, Footer, Sidebar, MobileNav
│       │   ├── game/              # GameCard, GameGrid, GameLauncher
│       │   ├── wallet/            # DepositForm, WithdrawForm, CoinSelector
│       │   ├── sports/            # EventCard, OddsDisplay, BetSlip
│       │   ├── promotion/         # AttendanceGrid, SpinWheel, MissionCard
│       │   └── common/            # AuthGuard, LoadingSkeleton, EmptyState
│       ├── stores/                # Zustand 스토어
│       │   ├── auth-store.ts
│       │   ├── game-store.ts
│       │   ├── wallet-store.ts
│       │   └── notification-store.ts
│       ├── hooks/                 # 커스텀 훅
│       │   ├── use-auth.ts
│       │   ├── use-games.ts
│       │   ├── use-wallet.ts
│       │   └── use-sports.ts
│       ├── lib/                   # 유틸리티
│       │   ├── api-client.ts      # Fastify 백엔드 API 클라이언트
│       │   ├── utils.ts           # cn(), formatAmount()
│       │   └── constants.ts       # 상수 (코인, 네트워크 등)
│       └── types/                 # 프론트 전용 타입 (shared/ 확장)
```

---

## 1. Phase 구조 (10 Phase, 총 42 Task)

### 우선순위 매트릭스

```
              높은 비즈니스 가치
                    ▲
                    │
     Phase 2~3     │    Phase 4~5
     (인증+DB)     │    (게임+지갑)
                    │
  ──────────────────┼──────────────────► 구현 복잡도
                    │
     Phase 0~1     │    Phase 6~8
     (인프라)       │    (이벤트+스포츠)
                    │
                    │    Phase 9
                    │    (통합+배포)
```

### Phase 요약

| Phase | 내용 | Task 수 | 우선순위 | 예상 |
|-------|------|---------|----------|------|
| **0** | 프로젝트 초기 설정 (모노레포, Docker, 환경변수) | 4 | CRITICAL | 기반 |
| **1** | DB 스키마 + Prisma 모델 설계 | 3 | CRITICAL | 기반 |
| **2** | 인증 시스템 (회원가입/로그인/JWT) | 4 | CRITICAL | 핵심 |
| **3** | 프론트엔드 기본 레이아웃 + 인증 UI | 4 | CRITICAL | 핵심 |
| **4** | 게임 로비 + 게임 런칭 (관리자 프록시) | 5 | P0 | 핵심 |
| **5** | 지갑/입출금 (암호화폐 전용) | 4 | P0 | 핵심 |
| **6** | 이벤트/보상 시스템 (출석/미션/스핀/페이백) | 5 | P1 | 확장 |
| **7** | 스포츠 베팅 (관리자 프록시) | 4 | P1 | 확장 |
| **8** | 추천/커미션 + 마이페이지 + 쪽지 | 5 | P1 | 확장 |
| **9** | 통합 테스트 + 프로덕션 배포 준비 | 4 | P2 | 마무리 |

---

## Phase 0: 프로젝트 초기 설정 (CRITICAL)

> **목표**: 모노레포 구조 + Docker 환경 + 공유 타입 시스템 구축
> **검증**: `docker compose up` → DB+Redis 기동 → Fastify 헬스체크 → Next.js 빌드 성공

### Task 0-1: 모노레포 프로젝트 스캐폴딩

**작업 내용:**
1. `user-page/` 디렉토리 생성
2. 루트 `package.json` (workspaces: backend, frontend, shared)
3. 루트 `tsconfig.json` (base config)
4. `.gitignore`, `.env.example`
5. `turbo.json` (빌드 파이프라인)

**생성 파일:**
- `user-page/package.json`
- `user-page/tsconfig.base.json`
- `user-page/turbo.json`
- `user-page/.gitignore`
- `user-page/.env.example`

**검증:**
- [ ] `npm install` 성공
- [ ] workspace 구조 인식

---

### Task 0-2: Docker Compose 환경 구성

**작업 내용:**
1. PostgreSQL 16 (포트 5435, DB: user_page_db)
2. Redis 7 (포트 6381)
3. 볼륨 영속화
4. 헬스체크 설정

**생성 파일:**
- `user-page/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5435:5432"]
    environment:
      POSTGRES_DB: user_page_db
      POSTGRES_USER: userpage
      POSTGRES_PASSWORD: secret
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U userpage -d user_page_db"]

  redis:
    image: redis:7-alpine
    ports: ["6381:6379"]
    volumes: [redis_data:/data]

volumes:
  postgres_data:
  redis_data:
```

**검증:**
- [ ] `docker compose up -d` → 둘 다 healthy
- [ ] `psql -h localhost -p 5435 -U userpage -d user_page_db` 접속 성공
- [ ] `redis-cli -p 6381 ping` → PONG

---

### Task 0-3: Fastify 백엔드 초기화

**작업 내용:**
1. `backend/package.json` + 의존성 설치
2. TypeScript 설정
3. Fastify 앱 진입점 + 헬스체크
4. Prisma 초기화
5. 환경변수 설정 (dotenv)

**주요 의존성:**
```json
{
  "dependencies": {
    "fastify": "^5",
    "@fastify/cors": "^11",
    "@fastify/jwt": "^9",
    "@fastify/redis": "^7",
    "@fastify/rate-limit": "^10",
    "@prisma/client": "^6",
    "bcryptjs": "^2.4",
    "zod": "^3.24"
  },
  "devDependencies": {
    "prisma": "^6",
    "typescript": "^5.7",
    "tsx": "^4",
    "@types/node": "^22",
    "@types/bcryptjs": "^2.4"
  }
}
```

**검증:**
- [ ] `cd backend && npm run dev` → Fastify 8003 기동
- [ ] `curl http://localhost:8003/health` → `{"status":"ok"}`

---

### Task 0-4: Next.js 프론트엔드 초기화

**작업 내용:**
1. `npx create-next-app@latest frontend` (App Router, TypeScript, TailwindCSS 4)
2. shadcn/ui 초기화 (new-york 스타일, neutral 컬러)
3. 다크모드 설정
4. 환경변수 설정 (`NEXT_PUBLIC_API_URL=http://localhost:8003`)
5. API 클라이언트 기본 구조

**검증:**
- [ ] `cd frontend && npx next dev --port 3002 --webpack` → 정상 기동
- [ ] 브라우저에서 `http://localhost:3002` 접근 성공
- [ ] TailwindCSS 적용 확인

---

## Phase 1: DB 스키마 + Prisma 모델 (CRITICAL)

> **목표**: 관리자 패널 DB 스키마와 호환되면서 독립적인 유저 DB 설계
> **핵심 원칙**: 유저 DB는 독립 운영하되, 관리자 API를 통해 데이터 동기화
> **검증**: `npx prisma migrate dev` → 모든 테이블 생성 → 시드 데이터 삽입

### Task 1-1: 핵심 사용자 테이블 설계

**Prisma 스키마 (핵심):**

```prisma
// 회원
model User {
  id              Int       @id @default(autoincrement())
  username        String    @unique @db.VarChar(20)
  nickname        String    @db.VarChar(20)
  passwordHash    String    @map("password_hash")
  phone           String?   @db.VarChar(15)
  status          UserStatus @default(ACTIVE)
  balance         Decimal   @default(0) @db.Decimal(18, 2)
  points          Decimal   @default(0) @db.Decimal(18, 2)
  bonusBalance    Decimal   @default(0) @map("bonus_balance") @db.Decimal(18, 2)
  referrerCode    String?   @map("referrer_code") @db.VarChar(20)
  myReferralCode  String    @unique @map("my_referral_code") @db.VarChar(20)
  vipLevel        Int       @default(1) @map("vip_level")
  commissionType  CommissionType @default(ROLLING) @map("commission_type")
  losingRate      Decimal   @default(0) @map("losing_rate") @db.Decimal(5, 2)
  commissionEnabled Boolean @default(true) @map("commission_enabled")
  depositAddress  String?   @map("deposit_address")
  depositNetwork  String?   @map("deposit_network") @db.VarChar(10)
  lastLoginAt     DateTime? @map("last_login_at")
  lastLoginIp     String?   @map("last_login_ip") @db.VarChar(45)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  referrer        User?     @relation("UserReferral", fields: [referrerId], references: [id])
  referrerId      Int?      @map("referrer_id")
  referrals       User[]    @relation("UserReferral")
  walletAddresses WalletAddress[]
  deposits        Deposit[]
  withdrawals     Withdrawal[]
  betRecords      BetRecord[]
  moneyLogs       MoneyLog[]
  pointLogs       PointLog[]
  messages        Message[]
  inquiries       Inquiry[]
  attendanceLogs  AttendanceLog[]
  missionProgress MissionProgress[]
  spinLogs        SpinLog[]
  gameRollingRates GameRollingRate[]
  loginHistory    LoginHistory[]
  commissionRecords CommissionRecord[]

  @@map("users")
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  BANNED
}

enum CommissionType {
  ROLLING
  LOSING
}
```

**검증:**
- [ ] `npx prisma migrate dev --name init` 성공
- [ ] users 테이블 생성 확인

---

### Task 1-2: 게임/거래/이벤트 테이블 설계

**테이블 목록 (25개):**

| 그룹 | 테이블 | 설명 |
|------|--------|------|
| **인증** | users, login_history, refresh_tokens | 회원 + 로그인 이력 |
| **지갑** | wallet_addresses, deposits, withdrawals | 암호화폐 입출금 |
| **게임** | game_categories, game_providers, games, bet_records, game_rolling_rates | 게임 카탈로그 + 베팅 |
| **재무** | money_logs, point_logs, commission_records | 자산 변동 이력 |
| **이벤트** | attendance_configs, attendance_logs, missions, mission_progress, spin_configs, spin_logs, payback_configs, promotions, user_promotions | 보상 시스템 |
| **소통** | messages, inquiries, inquiry_replies | 쪽지 + 문의 |
| **VIP** | vip_levels | VIP 등급 |

**검증:**
- [ ] 25개 테이블 전부 생성
- [ ] 외래 키 관계 정상

---

### Task 1-3: 시드 데이터 + 관리자 연동 설정

**시드 내용:**
1. 게임 카테고리 7종 (casino, slot, holdem, sports, shooting, coin, mini_game)
2. VIP 10등급 (브론즈~레전드)
3. 출석 보상 30일 설정
4. 미션 10종 (일일 5 + 주간 5)
5. 스핀 8단계 상품
6. 페이백 설정 (일일/주간)
7. 테스트 계정 (testuser / test1234!)

**관리자 연동 환경변수:**
```env
ADMIN_API_URL=http://localhost:8002
ADMIN_SERVICE_TOKEN=xxx  # 관리자 백엔드와 공유하는 서비스 토큰
```

**검증:**
- [ ] `npx prisma db seed` 성공
- [ ] 모든 시드 데이터 확인

---

## Phase 2: 인증 시스템 (CRITICAL)

> **목표**: 아이디/비밀번호 로그인 + 추천코드 필수 회원가입 + JWT 인증
> **관리자 패널 호환**: 동일 인증 로직 (추천코드 필수, JWT HS256)
> **검증**: 회원가입 → 로그인 → 토큰 갱신 → 로그아웃 전체 플로우

### Task 2-1: JWT 인증 플러그인

**파일:** `backend/src/plugins/auth.ts`

**구현:**
- Fastify JWT 플러그인 등록 (HS256, access 15분, refresh 7일)
- `fastify.authenticate` 데코레이터 (preHandler)
- 토큰 블랙리스트 (Redis)

**검증:**
- [ ] JWT 생성/검증 동작
- [ ] 만료 토큰 → 401 반환
- [ ] 블랙리스트 토큰 → 401 반환

---

### Task 2-2: 회원가입 API

**엔드포인트:** `POST /api/auth/register`

**Request Body (Zod 검증):**
```typescript
{
  username: string,     // 영문소문자+숫자 4~20자
  nickname: string,     // 2~20자
  password: string,     // 8자 이상, 영문+숫자
  phone: string,        // 01XXXXXXXXX 형식
  referrerCode: string  // 필수! 유효한 추천코드
}
```

**로직:**
1. 추천코드 유효성 검증 (해당 코드 가진 유저 존재 확인)
2. username 중복 체크
3. bcrypt 비밀번호 해싱
4. 고유 추천코드 자동 생성 (8자리 영숫자)
5. User 생성 (status: ACTIVE)
6. 게임별 기본 롤링율 생성 (7 카테고리)
7. 관리자 백엔드에 신규 회원 알림 (비동기)
8. 쪽지 발송: "환영합니다!" + 추천인에게 "새 추천 회원" 알림

**검증:**
- [ ] 추천코드 없이 가입 → 400
- [ ] 잘못된 추천코드 → 400
- [ ] 중복 username → 409
- [ ] 정상 가입 → 201 + 토큰 반환

---

### Task 2-3: 로그인/로그아웃/토큰 갱신 API

**엔드포인트:**
- `POST /api/auth/login` (username + password)
- `POST /api/auth/refresh` (refresh token)
- `POST /api/auth/logout` (refresh token 블랙리스트)

**보안:**
- 로그인 5회 실패 → 15분 계정 잠금 (Redis)
- Refresh Token Rotation (이전 토큰 블랙리스트)
- 로그인 이력 기록 (IP, UA, 기기)

**검증:**
- [ ] 정상 로그인 → access + refresh 토큰
- [ ] 5회 실패 → 잠금 메시지
- [ ] 리프레시 → 새 토큰 쌍
- [ ] 로그아웃 → 이전 토큰 무효화

---

### Task 2-4: 관리자 백엔드 연동 서비스

**파일:** `backend/src/utils/admin-api.ts`

**구현:**
- `AdminApiClient` 클래스 (HTTP 클라이언트)
- 서비스 토큰 인증 헤더
- 재시도 로직 (3회, 지수 백오프)
- 타임아웃 5초

**관리자 연동 API 목록:**
```typescript
// 게임 관련 (프록시)
getProviders(): Promise<Provider[]>
getGamesByProvider(code: string): Promise<Game[]>
launchGame(userId: number, gameId: string, platform: number): Promise<{ url: string }>

// 스포츠 관련 (프록시)
getLiveEvents(status: string): Promise<Event[]>
getEventOdds(eventId: number): Promise<Odds[]>

// 알림
notifyNewUser(user: UserInfo): Promise<void>
notifyDeposit(deposit: DepositInfo): Promise<void>
notifyWithdrawal(withdrawal: WithdrawalInfo): Promise<void>
```

**검증:**
- [ ] 관리자 백엔드 헬스체크 호출 성공
- [ ] 서비스 토큰 인증 동작
- [ ] 타임아웃/재시도 동작

---

## Phase 3: 프론트엔드 기본 레이아웃 + 인증 UI (CRITICAL)

> **목표**: 모바일 퍼스트 반응형 레이아웃 + 로그인/회원가입 페이지
> **디자인**: 다크 테마 기본 (카지노/게임 사이트 표준)
> **검증**: 모바일/데스크톱 반응형 + 인증 플로우 동작

### Task 3-1: 다크 테마 + 글로벌 스타일 시스템

**구현:**
- 카지노 다크 테마 (배경: #0f0f23, 카드: #1a1a2e, 강조: #e94560)
- 골드 악센트 (VIP, 잭팟, 보너스)
- CSS 변수 기반 테마 시스템
- 모바일 퍼스트 브레이크포인트

**검증:**
- [ ] 다크 테마 적용 확인
- [ ] 모바일 320px ~ 데스크톱 1920px 반응형

---

### Task 3-2: 메인 레이아웃 (Header + Sidebar + Footer)

**구현:**
- **Header**: 로고 + 잔액 표시 + 입금 버튼 + 알림 벨 + 프로필 메뉴
- **Sidebar** (데스크톱): 게임 카테고리 + 프로모션 + 고객센터
- **MobileNav** (모바일): 하단 탭 바 (홈/게임/스포츠/지갑/더보기)
- **Footer**: 라이센스 정보 + 빠른 링크

**검증:**
- [ ] 데스크톱: 사이드바 + 메인 콘텐츠 레이아웃
- [ ] 모바일: 하단 탭 바 + 풀 화면 콘텐츠
- [ ] 잔액 실시간 표시

---

### Task 3-3: 로그인 페이지

**구현:**
- 아이디 + 비밀번호 입력
- "아이디 저장" 체크박스 (localStorage)
- 에러 메시지 (한국어)
- 로그인 후 → 메인 페이지 리다이렉트
- 회원가입 링크

**검증:**
- [ ] 정상 로그인 → 메인 이동
- [ ] 실패 → 에러 메시지 표시
- [ ] 잠금 상태 → 남은 시간 표시

---

### Task 3-4: 회원가입 페이지

**구현:**
- 4단계 스텝 폼 (아이디 → 비밀번호 → 개인정보 → 추천코드)
- 실시간 유효성 검증 (Zod)
- 추천코드 유효성 실시간 체크
- 비밀번호 강도 표시기
- 가입 완료 → 자동 로그인

**검증:**
- [ ] 각 스텝 유효성 검증
- [ ] 추천코드 실시간 확인
- [ ] 가입 성공 → 자동 로그인 + 메인 이동

---

## Phase 4: 게임 로비 + 게임 런칭 (P0)

> **목표**: RapidAPI 100+ 프로바이더 게임을 유저에게 제공
> **구조**: 유저 백엔드 → 관리자 백엔드 프록시 → RapidAPI
> **검증**: 프로바이더 목록 → 게임 선택 → iframe 런칭

### Task 4-1: 게임 프록시 API (백엔드)

**엔드포인트:**
```
GET  /api/games/categories        → 7개 카테고리
GET  /api/games/providers         → 프로바이더 목록 (캐시)
GET  /api/games/providers/:code   → 프로바이더별 게임
GET  /api/games/search?q=         → 게임 검색
POST /api/games/launch            → 게임 런칭 URL
GET  /api/games/recent            → 최근 플레이 게임
GET  /api/games/popular           → 인기 게임
```

**검증:**
- [ ] 프로바이더 100+개 조회
- [ ] 게임 목록 + 썸네일
- [ ] 런칭 URL 생성 → iframe 열기

---

### Task 4-2: 메인 게임 로비 UI

**구현:**
- 상단 배너 슬라이더 (프로모션)
- 카테고리 탭 (카지노/슬롯/스포츠/미니게임/홀덤)
- 프로바이더 가로 스크롤 (로고 + 게임 수)
- 게임 카드 그리드 (썸네일 + 이름 + 프로바이더)
- 검색 바 (게임명/프로바이더명)
- 무한 스크롤 (페이지네이션)

**검증:**
- [ ] 카테고리 전환 동작
- [ ] 프로바이더 필터 동작
- [ ] 검색 동작
- [ ] 게임 카드 썸네일 표시

---

### Task 4-3: 게임 런칭 시스템

**구현:**
- 게임 클릭 → 런칭 확인 모달 (잔액 표시)
- 데스크톱: 새 탭 또는 iframe
- 모바일: 풀스크린 iframe
- 게임 종료 시 잔액 갱신
- 최근 플레이 게임 기록 (최대 20개)

**검증:**
- [ ] 게임 런칭 → iframe 열기
- [ ] 모바일 풀스크린 동작
- [ ] 게임 종료 후 잔액 갱신

---

### Task 4-4: 최근 플레이 + 인기 게임

**구현:**
- 최근 플레이: localStorage + DB 동기화 (최대 20개)
- 인기 게임: 런칭 횟수 기반 자동 집계 (DB)
- 메인 페이지에 두 섹션 표시

**검증:**
- [ ] 게임 플레이 후 최근 목록 갱신
- [ ] 인기 게임 순위 표시

---

### Task 4-5: 게임 데모 모드 (시니어 추가 제안)

**구현:**
- 비로그인 사용자도 데모 모드로 게임 체험 가능
- RapidAPI `money: 0` 파라미터 활용
- "무료 체험" 배지 표시
- 데모 → 실제 전환 시 로그인 유도

**검증:**
- [ ] 비로그인 상태에서 데모 게임 실행
- [ ] "가입하고 실제 플레이하기" CTA 표시

---

## Phase 5: 지갑/입출금 (P0)

> **목표**: USDT/TRX/ETH/BTC/BNB 암호화폐 입출금
> **관리자 연동**: 입출금 신청 → 관리자 승인/자동승인
> **검증**: 입금 주소 생성 → 출금 신청 → 거래 내역 확인

### Task 5-1: 지갑 API (백엔드)

**엔드포인트:**
```
GET  /api/wallet/balance           → 잔액 + 포인트 + 보너스
GET  /api/wallet/addresses         → 내 지갑 주소 목록
POST /api/wallet/addresses         → 출금 주소 등록
DELETE /api/wallet/addresses/:id   → 출금 주소 삭제
POST /api/wallet/deposit           → 입금 신청
POST /api/wallet/withdraw          → 출금 신청
GET  /api/wallet/transactions      → 거래 내역 (입출금)
GET  /api/wallet/transactions/:id  → 거래 상세
```

**검증:**
- [ ] 잔액 조회 정상
- [ ] 입금 신청 → pending 상태
- [ ] 출금 신청 → 잔액 차감 + pending
- [ ] 거래 내역 페이지네이션

---

### Task 5-2: 입금 페이지 UI

**구현:**
- 코인 선택 (USDT/TRX/ETH/BTC/BNB) + 아이콘
- 네트워크 자동 선택 (USDT→TRC20, ETH→ERC20 등)
- 입금 주소 QR 코드 + 복사 버튼
- 네트워크 주의 경고 문구 (빨간 박스)
- 최근 입금 내역 (상태: 대기/승인/거부)
- 최소 입금액 안내

**검증:**
- [ ] 코인 선택 → 주소 + QR 표시
- [ ] 주소 복사 동작
- [ ] 입금 내역 표시

---

### Task 5-3: 출금 페이지 UI

**구현:**
- 코인 선택 + 네트워크
- 저장된 출금 주소 선택 또는 새 주소 입력
- 출금 금액 입력 + 수수료 표시 + 실수령액
- 비밀번호 확인
- 출금 한도 안내 (일일/1회)
- 최근 출금 내역

**검증:**
- [ ] 출금 신청 → 잔액 차감
- [ ] 잔액 부족 → 에러
- [ ] 출금 한도 초과 → 에러

---

### Task 5-4: 거래 내역 페이지

**구현:**
- 탭: 전체 / 입금 / 출금
- 필터: 기간 (오늘/7일/30일/커스텀), 상태 (전체/대기/완료/거부)
- 테이블: 일시, 유형, 코인, 금액, TX Hash (링크), 상태
- TX Hash → 블록체인 익스플로러 링크

**검증:**
- [ ] 필터 + 페이지네이션 동작
- [ ] TX Hash 링크 동작

---

## Phase 6: 이벤트/보상 시스템 (P1)

> **목표**: 출석체크, 미션, 럭키스핀, 페이백, 입금보너스, VIP
> **관리자 연동**: 보상 설정은 관리자에서 관리, 유저는 실행만
> **검증**: 각 이벤트 실행 → 포인트/캐시 적립 → 로그 확인

### Task 6-1: 출석체크

**백엔드:** `POST /api/attendance/check-in`
**프론트:** 달력 UI (30일 그리드) + 연속 출석 보너스 표시

**검증:**
- [ ] 출석 체크 → 포인트 적립
- [ ] 당일 중복 체크 → 에러
- [ ] 연속 출석 보너스 정확

---

### Task 6-2: 미션 시스템

**백엔드:**
```
GET  /api/missions             → 일일/주간 미션 목록
POST /api/missions/:id/claim   → 보상 수령
```
**프론트:** 미션 카드 리스트 + 진행률 바 + 수령 버튼

**검증:**
- [ ] 미션 목록 + 진행률 표시
- [ ] 완료된 미션 보상 수령
- [ ] 중복 수령 방지

---

### Task 6-3: 럭키스핀

**백엔드:** `POST /api/spin/execute`
**프론트:** 룰렛 휠 애니메이션 (CSS/Canvas) + 결과 모달

**검증:**
- [ ] 스핀 실행 → 애니메이션 → 결과 표시
- [ ] 일일 한도 체크
- [ ] 보상 즉시 적립

---

### Task 6-4: 프로모션 허브 + VIP

**프론트:**
- 프로모션 카드 그리드 (배너, 설명, 참여 버튼)
- VIP 현재 등급 + 진행률 + 혜택 표
- 페이백 현황 (일일/주간 손실 → 보상 예정)
- 입금 보너스 안내

**검증:**
- [ ] 프로모션 목록 표시
- [ ] VIP 등급 + 혜택 정확
- [ ] 페이백 금액 계산 정확

---

### Task 6-5: 포인트 전환 + 포인트 몰 (시니어 추가 제안)

**구현:**
- 포인트 → 캐시 전환 기능 (비율: 100P = 1원)
- 포인트 이력 조회
- 포인트 획득 방법 안내 페이지

**검증:**
- [ ] 포인트 전환 → 잔액 증가 + 포인트 차감
- [ ] 전환 이력 기록

---

## Phase 7: 스포츠 베팅 (P1)

> **목표**: Odds Feed + SportAPI7 실시간 스포츠 데이터 표시
> **구조**: 관리자 백엔드 프록시 경유
> **검증**: 라이브 이벤트 표시 → 배당률 실시간 갱신

### Task 7-1: 스포츠 프록시 API (백엔드)

**엔드포인트:**
```
GET /api/sports/events?status=LIVE|SCHEDULED
GET /api/sports/events/:id/odds
GET /api/sports/live/:sport
GET /api/esports/live
GET /api/esports/categories
```

**검증:**
- [ ] 라이브 이벤트 조회
- [ ] 배당률 데이터 수신
- [ ] 30초 캐싱 동작

---

### Task 7-2: 스포츠 메인 페이지

**구현:**
- 종목 탭 (축구/농구/야구/테니스/e스포츠 등)
- 라이브 이벤트 카드 (팀명, 스코어, 경기 시간)
- 배당률 표시 (1X2, 승무패)
- 30초 자동 갱신

**검증:**
- [ ] 종목별 필터
- [ ] 라이브 스코어 실시간 갱신
- [ ] 배당률 표시 정확

---

### Task 7-3: 경기 상세 + 배당률 비교

**구현:**
- 경기 클릭 → 상세 페이지
- 멀티 북메이커 배당률 비교 테이블
- 마켓 유형별 탭 (1X2, Over/Under, BTTS)
- 최고 배당 하이라이트

**검증:**
- [ ] 7개 북메이커 배당률 비교
- [ ] 마켓 유형별 표시

---

### Task 7-4: e스포츠 전용 페이지

**구현:**
- CS2, LoL, 도타2, 발로란트 카테고리
- 시리즈 형식 (Bo3/Bo5) 표시
- 맵별 스코어

**검증:**
- [ ] e스포츠 라이브 매치 표시
- [ ] 시리즈/맵 정보 표시

---

## Phase 8: 추천/커미션 + 마이페이지 + 쪽지 (P1)

> **목표**: 워터폴 커미션 시스템 + 종합 마이페이지
> **검증**: 추천 → 하부 베팅 → 커미션 적립 → 출금 가능

### Task 8-1: 추천/어필리에이트 페이지

**구현:**
- 내 추천코드 (복사 버튼 + 공유 링크)
- 추천 대시보드 (총 추천 수, 이번 달 커미션, 누적 커미션)
- 게임별 커미션 요율 테이블 (7카테고리)
- 추천 회원 목록
- 커미션 내역 (필터: 롤링/죽장, 게임별)

**검증:**
- [ ] 추천코드 공유 동작
- [ ] 커미션 현황 정확
- [ ] 커미션 내역 필터

---

### Task 8-2: 마이페이지

**구현:**
- 기본 정보 (아이디, 닉네임, 전화번호)
- 비밀번호 변경
- 베팅 내역 (게임별, 기간별)
- 자산 변동 이력 (머니 + 포인트)
- VIP 등급 + 진행률

**검증:**
- [ ] 프로필 수정 동작
- [ ] 비밀번호 변경 동작
- [ ] 베팅 내역 조회

---

### Task 8-3: 쪽지 시스템

**백엔드:**
```
GET  /api/messages              → 수신 쪽지 목록
GET  /api/messages/:id          → 쪽지 상세 (읽음 처리)
GET  /api/messages/unread-count → 안 읽은 쪽지 수
DELETE /api/messages/:id        → 쪽지 삭제
```

**프론트:** 쪽지함 UI + 안 읽은 수 배지 (헤더 알림 벨)

**검증:**
- [ ] 쪽지 목록 + 읽음 처리
- [ ] 안 읽은 수 실시간 갱신
- [ ] 삭제 동작

---

### Task 8-4: 고객센터 (문의)

**백엔드:**
```
GET  /api/inquiries             → 내 문의 목록
POST /api/inquiries             → 문의 등록
GET  /api/inquiries/:id         → 문의 상세 + 답변
```

**프론트:** 문의 작성 폼 + 문의 이력 + 답변 표시

**검증:**
- [ ] 문의 등록 → 관리자에게 알림
- [ ] 답변 확인

---

### Task 8-5: 실시간 알림 시스템 (시니어 추가 제안)

**구현:**
- SSE (Server-Sent Events) 또는 WebSocket
- 알림 유형: 입금 승인, 출금 완료, 이벤트 보상, 시스템 공지
- 브라우저 푸시 알림 (선택적)
- 알림 센터 (드롭다운)

**검증:**
- [ ] 입금 승인 시 실시간 알림
- [ ] 알림 센터 동작

---

## Phase 9: 통합 테스트 + 프로덕션 배포 (P2)

> **목표**: 전체 E2E 검증 + Docker 프로덕션 빌드 + Nginx 설정

### Task 9-1: E2E 통합 테스트

**전체 플로우:**
1. 회원가입 (추천코드)
2. 로그인
3. 게임 로비 → 게임 런칭
4. 입금 신청 → (관리자 승인) → 잔액 증가
5. 게임 플레이 → 베팅 기록
6. 출석 체크 → 포인트 적립
7. 포인트 전환
8. 출금 신청
9. 커미션 확인 (하부 베팅 시)
10. 쪽지 확인

**검증:**
- [ ] 10단계 플로우 전체 성공
- [ ] 에러 없이 동작
- [ ] 응답 시간 2초 이내

---

### Task 9-2: 프로덕션 Docker 빌드

**생성 파일:**
- `backend/Dockerfile` (Node.js 22 Alpine, multi-stage)
- `frontend/Dockerfile` (Next.js standalone)
- `docker-compose.prod.yml`
- `nginx/nginx.conf` (SSL + 리버스 프록시)

**검증:**
- [ ] `docker compose -f docker-compose.prod.yml build` 성공
- [ ] 전체 서비스 기동 + 헬스체크

---

### Task 9-3: 보안 점검

**체크리스트:**
- [ ] API Key 환경변수 (.env) 확인
- [ ] CORS 설정 (프로덕션 도메인만)
- [ ] Rate Limit 설정
- [ ] SQL Injection 방지 (Prisma 파라미터 바인딩)
- [ ] XSS 방지 (React 기본 + CSP 헤더)
- [ ] JWT 시크릿 강도 확인

---

### Task 9-4: CLAUDE.md 인수인계 문서 작성

**내용:**
- 유저 페이지 기술 스택 + 포트 매핑
- 개발/배포 명령어
- DB 스키마 요약
- 관리자 연동 구조
- 알려진 이슈

---

## 2. 시니어 개발자 추가 제안 기능

### 제안 1: 다국어 지원 (i18n) 기반 구축
- Phase 0에서 `next-intl` 기반 구축
- 기본 한국어 + 영어/일본어 확장 가능
- 게임 카테고리명, UI 라벨 모두 i18n

### 제안 2: PWA (Progressive Web App)
- 모바일 홈 화면 추가 가능
- 오프라인 캐시 (게임 목록)
- 푸시 알림 (입금 승인 등)

### 제안 3: 소셜 공유 + 추천 링크
- 텔레그램/카카오톡 공유 버튼
- 추천 링크: `https://domain.com/ref/{code}`
- OG 메타 태그 (미리보기)

### 제안 4: 게임 즐겨찾기
- 좋아하는 게임 즐겨찾기 (DB 저장)
- 즐겨찾기 게임 빠른 접근 (메인 페이지 상단)

### 제안 5: 베팅 통계 대시보드
- 오늘/이번주/이번달 베팅 요약
- 게임별 승률 차트
- 수익/손실 그래프

### 제안 6: 라이브 채팅 (향후)
- WebSocket 기반 실시간 채팅
- 게임 로비 내 채팅방
- 관리자 1:1 상담

---

## 3. 단계별 완료 체크 프로토콜

### 🔴 필수: 모든 Task 완료 시

> **중단 방지 + 복구를 위한 강제 규칙**

```
1. ✅ 검증 체크리스트 모든 항목 통과
2. ✅ 이 문서의 해당 Task [ ] → [x] 변경
3. ✅ 프론트엔드 빌드 확인: cd frontend && npx next build --webpack
4. ✅ 백엔드 기동 확인: cd backend && npm run dev → 에러 없음
5. ✅ CLAUDE.md 진행 상황 업데이트
```

### 🔵 Phase 완료 시 추가

```
6. ✅ 전체 서비스 재시작 후 동작 확인
7. ✅ git add + git commit (Phase 단위)
8. ✅ CLAUDE.md에 Phase 완료 + 핵심 사항 기록
9. ✅ 이 계획서에 Phase 완료 날짜 기록
```

### 🟢 중단 복구 가이드

```
1. git log --oneline -5 → 마지막 커밋 확인
2. 이 계획서의 진행 상태 트래커 확인
3. CLAUDE.md의 유저 페이지 섹션 확인
4. 마지막 완료 Task 다음부터 재개
```

---

## 4. 진행 상태 트래커

| Phase | Task | 상태 | 검증 | 완료일 |
|-------|------|------|------|--------|
| 0 | 0-1: 모노레포 스캐폴딩 | ✅ | ✅ | 2026-02-24 |
| 0 | 0-2: Docker Compose | ✅ | ✅ | 2026-02-24 |
| 0 | 0-3: Fastify 초기화 | ✅ | ✅ | 2026-02-24 |
| 0 | 0-4: Next.js 초기화 | ✅ | ✅ | 2026-02-24 |
| 1 | 1-1: 사용자 테이블 | ✅ | ✅ | 2026-02-24 |
| 1 | 1-2: 게임/거래/이벤트 테이블 | ✅ | ✅ | 2026-02-24 |
| 1 | 1-3: 시드 데이터 | ✅ | ✅ | 2026-02-24 |
| 2 | 2-1: JWT 인증 플러그인 | ✅ | ✅ | 2026-02-24 |
| 2 | 2-2: 회원가입 API | ✅ | ✅ | 2026-02-24 |
| 2 | 2-3: 로그인/로그아웃 | ✅ | ✅ | 2026-02-24 |
| 2 | 2-4: 관리자 연동 서비스 | ✅ | ✅ | 2026-02-24 |
| 3 | 3-1: 다크 테마 + 스타일 | ✅ | ✅ | 2026-02-24 |
| 3 | 3-2: 메인 레이아웃 | ✅ | ✅ | 2026-02-24 |
| 3 | 3-3: 로그인 UI | ✅ | ✅ | 2026-02-24 |
| 3 | 3-4: 회원가입 UI | ✅ | ✅ | 2026-02-24 |
| 4 | 4-1: 게임 프록시 API | ✅ | ✅ | 2026-02-24 |
| 4 | 4-2: 게임 로비 UI | ✅ | ✅ | 2026-02-24 |
| 4 | 4-3: 게임 런칭 | ✅ | ✅ | 2026-02-24 |
| 4 | 4-4: 최근/인기 게임 | ✅ | ✅ | 2026-02-24 |
| 4 | 4-5: 게임 데모 모드 | ✅ | ✅ | 2026-02-24 |
| 5 | 5-1: 지갑 API | ✅ | ✅ | 2026-02-24 |
| 5 | 5-2: 입금 UI | ✅ | ✅ | 2026-02-24 |
| 5 | 5-3: 출금 UI | ✅ | ✅ | 2026-02-24 |
| 5 | 5-4: 거래 내역 | ✅ | ✅ | 2026-02-24 |
| 6 | 6-1: 출석체크 | ✅ | ✅ | 2026-02-24 |
| 6 | 6-2: 미션 시스템 | ✅ | ✅ | 2026-02-24 |
| 6 | 6-3: 럭키스핀 | ✅ | ✅ | 2026-02-24 |
| 6 | 6-4: 프로모션 + VIP | ✅ | ✅ | 2026-02-24 |
| 6 | 6-5: 포인트 전환 | ✅ | ✅ | 2026-02-24 |
| 7 | 7-1: 스포츠 프록시 API | ✅ | ✅ | 2026-02-24 |
| 7 | 7-2: 스포츠 메인 UI | ✅ | ✅ | 2026-02-24 |
| 7 | 7-3: 경기 상세 + 배당률 | ✅ | ✅ | 2026-02-24 |
| 7 | 7-4: e스포츠 페이지 | ✅ | ✅ | 2026-02-24 |
| 8 | 8-1: 추천/어필리에이트 | ✅ | ✅ | 2026-02-24 |
| 8 | 8-2: 마이페이지 | ✅ | ✅ | 2026-02-24 |
| 8 | 8-3: 쪽지 시스템 | ✅ | ✅ | 2026-02-24 |
| 8 | 8-4: 고객센터 | ✅ | ✅ | 2026-02-24 |
| 8 | 8-5: 실시간 알림 | ✅ | ✅ | 2026-02-24 |
| 9 | 9-1: E2E 통합 테스트 | ✅ | ✅ | 2026-02-24 |
| 9 | 9-2: 프로덕션 Docker | ✅ | ✅ | 2026-02-24 |
| 9 | 9-3: 보안 점검 | ✅ | ✅ | 2026-02-24 |
| 9 | 9-4: CLAUDE.md 인수인계 | ✅ | ✅ | 2026-02-24 |

---

## 5. 에이전트 팀 활용 전략

### Phase별 에이전트 병렬화

| Phase | 병렬 가능 Task |
|-------|---------------|
| 0 | [0-1] → [0-2, 0-3, 0-4 병렬] |
| 1 | [1-1, 1-2 병렬] → [1-3] |
| 2 | [2-1] → [2-2, 2-3 병렬] → [2-4] |
| 3 | [3-1] → [3-2] → [3-3, 3-4 병렬] |
| 4 | [4-1] → [4-2, 4-3 병렬] → [4-4, 4-5 병렬] |
| 5 | [5-1] → [5-2, 5-3 병렬] → [5-4] |
| 6 | [6-1, 6-2, 6-3 병렬] → [6-4, 6-5 병렬] |
| 7 | [7-1] → [7-2, 7-3, 7-4 병렬] |
| 8 | [8-1, 8-2, 8-3 병렬] → [8-4, 8-5 병렬] |
| 9 | [9-1] → [9-2, 9-3 병렬] → [9-4] |

### 에이전트 역할 배분

- **Lead (Opus 4.6)**: 아키텍처 결정, 코드 리뷰, 통합
- **Backend Agent**: Fastify 라우트, Prisma 모델, 서비스 로직
- **Frontend Agent**: Next.js 페이지, 컴포넌트, 스타일
- **QA Agent**: 검증 체크리스트 실행, 빌드 테스트

---

## 6. 관리자 백엔드 연동 API 매핑

유저 백엔드가 관리자 백엔드에 호출할 엔드포인트:

| 유저 기능 | 관리자 API | 메서드 |
|-----------|-----------|--------|
| 게임 프로바이더 목록 | `/api/v1/external-api/casino/providers` (캐시) | GET |
| 프로바이더별 게임 | `/api/v1/external-api/casino/games/{code}` | GET |
| 게임 런칭 URL | `/api/v1/external-api/casino/launch` | POST |
| 스포츠 이벤트 | `/api/v1/external-api/sports/events` | GET |
| 스포츠 배당률 | `/api/v1/external-api/sports/odds/{id}` | GET |
| 스포츠 라이브 | `/api/v1/external-api/sports/live/{sport}` | GET |
| e스포츠 | `/api/v1/external-api/esports/live` | GET |
| 신규 회원 알림 | 텔레그램 API (직접) 또는 관리자 웹훅 | POST |
| 입출금 알림 | 텔레그램 API (직접) 또는 관리자 웹훅 | POST |

**주의**: 관리자 백엔드에 `user-proxy` 엔드포인트 추가 필요 (Phase 2 Task 2-4에서 처리)

---

*이 계획서는 세션 중단 시 복구 지점으로 사용됩니다. 모든 Task 완료 시 반드시 이 문서를 업데이트하세요.*
