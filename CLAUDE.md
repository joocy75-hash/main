# 통합 게임 관리자 패널 (Admin Panel)

> **상태**: Phase 0~13 전체 완료 + 회원 상세 8탭 + 회원 목록 리뉴얼 + 계층적 커미션 시스템 + 암호화폐 입출금 전환 | Backend 137 routes | Frontend 41 routes + 8탭 + 슬라이드 패널
> **Phase 상세**: @docs/reference/phases-completed.md
> **회원 상세 계획서**: @docs/plans/user-detail-plan.md
> **양방향 운영 기능 계획서**: @docs/plans/2026-02-20-bidirectional-operations-design.md
> **RapidAPI 통합 계획서**: @docs/plans/2026-02-24-rapidapi-integration-plan.md
> **유저 페이지 계획서**: @docs/plans/2026-02-24-user-page-implementation-plan.md
> **유저 페이지 상태**: Phase 0~9 전체 완료 (2026-02-24)
> **유저 페이지 스택**: Turborepo + Next.js 16 + Fastify 5 + TypeScript (ESM) + Prisma 6 + PostgreSQL 16 + Redis 7
> **유저 페이지 위치**: `user-page/` (모노레포: backend, frontend, shared)
> **유저 페이지 포트**: Backend 8003, Frontend 3002, PostgreSQL 5435, Redis 6381
> **품질 기준서**: @docs/standards/QUALITY-STANDARDS.md (코드 리뷰/수정/개발의 절대 기준)

## 기술 스택

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript 5.7 + TailwindCSS 4 + shadcn/ui + Zustand
- **Backend**: Python 3.14 + FastAPI 0.115 + SQLModel + Alembic + PostgreSQL 16 + Redis 7
- **인프라**: Docker Compose (dev/prod 분리) + Nginx

## 개발 명령어

```bash
# Backend
cd backend && source .venv/bin/activate && PYTHONPATH=. uvicorn app.main:app --port 8002 --reload

# Frontend (한글 경로 → --webpack 필수)
cd frontend && npx next dev --port 3001 --webpack

# Frontend 빌드
cd frontend && npx next build --webpack

# Docker DB+Redis
docker compose up db redis -d

# Alembic (PYTHONPATH=. 필수)
cd backend && source .venv/bin/activate && PYTHONPATH=. alembic upgrade head

# 시드 데이터
cd backend && source .venv/bin/activate && python scripts/seed.py

# 로그인: superadmin / admin1234!
```

## 코드 스타일

**Python**: PEP 8, Black, type hints 필수, async/await 우선, snake_case
**TypeScript**: 함수형 선호, camelCase, kebab-case 파일명, 세미콜론, 싱글 쿼트, type 선호

## 핵심 규칙

- 코드 수정 전 반드시 파일 읽기
- 기존 코드 패턴 따르기
- 불필요한 주석/docstring 추가 금지
- console.log / print 디버깅 코드 남기지 않기
- .env 파일 커밋 금지
- 파일 삭제/DB 데이터 삭제 전 반드시 확인
- 패키지 버전 임의 변경 금지
- 명시적 요청 없이 커밋/푸시 금지
- 프로덕션 서버 직접 조작 금지
- **품질 기준서 준수 필수**: `docs/standards/QUALITY-STANDARDS.md` 참조
  - 금전 코드 → 트랜잭션 + 동시성 보호 + 멱등성 + 감사 추적
  - 인증 코드 → 환경변수 필수 + 토큰 블랙리스트 + 권한 검증
  - 리뷰 → CRITICAL만 즉시 수정, 최대 2회 사이클, CRITICAL 0건이면 통과

## 코드 품질 도구

- **ESLint**: `no-alert` 룰 활성화 → `alert()/confirm()/prompt()` 사용 금지, `useToast()` 사용
- **ruff**: `E, F, I, N, W, UP, B, SIM, T20, RUF` 룰셋 → `print()` 감지, 미사용 import, 버그 패턴
- **퍼미션 검증**: `bash scripts/verify-permissions.sh` → 프론트/백엔드/시드 퍼미션 일관성 자동 검증

## 신규 모듈 추가 시 체크리스트

새 관리 모듈(예: attendance, spin, popup 등) 추가 시 반드시:

1. **백엔드 퍼미션 문자열**: `PermissionChecker("module.view")` — 시드와 동일한 **단수형** 사용
2. **시드 퍼미션 등록**: `backend/scripts/seed.py` → `PERMISSION_MODULES`에 모듈 추가
3. **프론트엔드 사이드바**: `frontend/src/components/sidebar-nav.tsx` → 정확한 퍼미션 문자열 사용
4. **alert() 금지**: `useToast()` 사용 (`@/components/toast-provider`)
5. **window.confirm() 대체**: 삭제 확인에는 허용하되, 알림 목적 사용 금지
6. **퍼미션 검증 실행**: `bash scripts/verify-permissions.sh` → PASS 확인
7. **게임 카테고리명**: `mini_game` (언더스코어 포함, `minigame` 금지)

## 알려진 이슈

- 한글 경로(관리자페이지) → Turbopack 실패 → `--webpack` 필수
- zsh 괄호 글로빙: Next.js `(auth)`, `(main)` 등 괄호 포함 경로는 git 명령에서 반드시 `"따옴표"` 감싸기 필요
- PostgreSQL 포트: **5433** (기존 5432 충돌)
- passlib + bcrypt 4.x 비호환 → bcrypt 직접 사용
- 포트: Backend **8002**, Frontend **3001**
- Alembic: `PYTHONPATH=.` 필수

## 핵심 아키텍처

- **에이전트 트리**: Closure Table (admin_user_tree) - 최대 6단계
- **커미션**: 계층적 워터폴 분배 → **상세: `.claude/skills/commission-logic/SKILL.md`**
  - 롤링(베팅금 %) + 죽장(손실금 %) - 7게임 카테고리 × 에이전트별 독립 요율
  - 워터폴: 각 에이전트 수령 = 자신 요율 - 자식 요율 (하위→상위 순)
  - 검증: 자식 요율 ≤ 부모 요율 (부모 천장 + 자식 바닥)
- **입출금**: 암호화폐 전용 (현금 계좌이체 없음) → **상세: `.claude/skills/crypto-payment/SKILL.md`**
  - USDT(메인) + TRX/ETH/BTC/BNB(서브) | TRC20/ERC20/BEP20/BTC
  - pending → approved/rejected 상태 머신, SELECT FOR UPDATE 잠금
- **인증**: JWT HS256 + Refresh Token + 2FA TOTP
- **권한**: RBAC 47개 퍼미션, PermissionChecker 의존성
- **외부 연동**: BaseConnector 어댑터 패턴 (4 커넥터: casino/sports/slot/holdem)

## 회원 상세정보 강화 (2026-02-18)

8탭 구조 전면 리뉴얼 완료:
- **신규 테이블 11개**: user_login_history, user_wallet_addresses, user_betting_permissions, user_null_betting_configs, user_game_rolling_rates, bet_records, money_logs, point_logs, inquiries, inquiry_replies, messages
- **신규 API 22개**: /users/{id}/detail, /statistics, /wallet-addresses(CRUD), /betting-permissions, /null-betting, /rolling-rates, /reset-password, /set-password, /suspend, /bets, /money-logs, /point-logs, /login-history, /inquiries(CRUD+reply), /messages(CRUD+read)
- **프론트엔드 파일**: `frontend/src/app/dashboard/users/[id]/` (page.tsx + tab-*.tsx 8개) + `frontend/src/hooks/use-user-detail.ts`
- **8탭**: 기본정보, 베팅, 머니, 포인트, 입출금, 문의내역, 추천코드, 쪽지
- **컬러 시스템**: Blue=긍정(활성/승인/지급), Red=부정(정지/회수/거부)

## Phase 1: 회원 목록 리뉴얼 + 슬라이드 패널 (2026-02-18)

- 요약 카드 3개 (전체회원/정상/총 보유금) - `/api/v1/users/summary-stats` API 신규
- 상태 필터 버튼 (전체/정상/정지/차단/대기)
- 등급 필터 버튼 (전체/부본사/총판/대리점)
- 클라이언트 페이지네이션 (10/20/50/100건)
- 슬라이드 패널: shadcn/ui Sheet (900px) - 8탭 재활용
- 공유 컴포넌트: `frontend/src/components/user-detail-content.tsx`
- 기존 `/dashboard/users/[id]` 페이지 유지 (직접 URL 접속용)

## 암호화폐 입출금 전환 (2026-02-18)

은행 계좌이체 → 암호화폐 전용 입출금으로 전면 전환:
- **코인**: USDT(메인), TRX, ETH, BTC, BNB / **네트워크**: TRC20, ERC20, BEP20, BTC
- **DB 변경**: `user_bank_accounts` → `user_wallet_addresses` (coin_type/network/address/label)
- **User 모델**: `virtual_account_bank/number` → `deposit_address/deposit_network`
- **Transaction 모델**: coin_type, network, tx_hash, wallet_address, confirmations 필드 추가
- **API 변경**: `/users/{id}/bank-accounts` → `/users/{id}/wallet-addresses` (CRUD 4개)
- **프론트엔드**: 계좌 UI → 지갑주소 UI, KRW 표시 → USDT 표시, TX Hash 복사 기능
- **마이그레이션**: `d4e5f6g7h8i9_crypto_payment_conversion.py`

## 텔레그램 알림 시스템 (2026-02-18)

- **서비스**: `backend/app/services/telegram_service.py` (비동기 fire-and-forget)
- **알림 템플릿**: `backend/app/services/notification_service.py`
- **설정**: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (빈값이면 자동 비활성)
- **트리거**: 입금/출금 신청, 승인/거부, 대규모 거래 감지, 신규 회원 가입
- **연동 위치**: `backend/app/api/v1/finance.py`

## 프로덕션 배포

- **자동 마이그레이션**: `backend/entrypoint.sh` (Alembic upgrade head → uvicorn 시작)
- **SSL**: `nginx/nginx-ssl.conf` (Let's Encrypt, HTTPS 강제 리다이렉트)
- **백업**: `scripts/backup-db.sh` (pg_dump + gzip, 7일 자동 정리)
- **환경변수**: `.env.prod.example` 참조 (DB_PASSWORD, SECRET_KEY 필수)
- **보안**: prod compose에서 `${SECRET_KEY:?required}`, `${DB_PASSWORD:?required}` 강제

## 양방향 운영 기능 완성 (2026-02-20 완료)

> **계획서**: `docs/plans/2026-02-20-bidirectional-operations-design.md`
> **결과**: 10개 핵심 운영 기능 중 10/10 완성 → **100% 달성**
> **Backend**: 299 routes | Phase 1~5 전체 완료

### 5 Phase 구조 (18 Task) - ALL COMPLETE

| Phase | 내용 | 상태 |
|-------|------|------|
| 1 | 핵심 양방향 API (회원가입/활성화/포인트/로그아웃) | ✅ |
| 2 | 보상 지급 엔진 (출석/미션/스핀/페이백/프로모션) | ✅ |
| 3 | 쪽지 알림 시스템 (자동알림 + 대량발송) | ✅ |
| 4 | 회수/취소 (프로모션/쿠폰/커미션) | ✅ |
| 5 | 자동 승인 룰 + 메모 이력 | ✅ |

### 핵심 설계 결정

- **회원가입**: 추천코드 필수 + 자동승인 (추천코드 없으면 거절)
- **이벤트 지급**: 혼합형 (임계값 이하 자동, 초과 관리자 승인)
- **보상 엔진**: `RewardEngine` 단일 진입점 → 모든 이벤트/프로모션 공통
- **쪽지 알림**: `MessageService` 템플릿 기반, 모든 상태변경/지급에 자동 발송
- **양방향 원칙**: 지급↔회수, 활성화↔비활성화, 승인↔거절 모두 쌍으로 구현

### 신규 테이블 (6개)

`pending_rewards`, `user_attendance_logs`, `user_missions`, `user_spin_logs`, `auto_approve_rules`, `user_memos`

### 신규 서비스 (2개)

- `backend/app/services/reward_engine.py` - 보상 지급 엔진
- `backend/app/services/message_service.py` - 쪽지 발송 서비스

### 작업 지침

- Task 완료마다 커밋 + 이 문서 업데이트
- Phase 완료마다 빌드 검증 + swagger 확인
- 중단 시 계획서 체크리스트로 복구 지점 파악

## 유저 사이트 (user-site/) - 2026-02-19 추가

### 현황

`~/Desktop/casino/` 프로젝트를 `user-site/`로 전체 복사 (2026-02-19). **Phase 0 환경 설정 완료.**

- **원본**: `~/Desktop/casino/` (Laravel 12 + Next.js 15 게임 플랫폼, 전체 완성)
- **복사 위치**: `user-site/` (node_modules, vendor, .next, .git 제외)
- **목적**: 유저용 게임 사이트 (독립 운영)
- **작업 계획서**: `docs/plans/2026-02-19-user-site-customization-design.md` (8 Phase)
- **현재 Phase**: P0 완료 → P1 브랜딩 진행 예정

### user-site 기술 스택 (완전 분리 아키텍처)

- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS 4 + Zustand
- **Backend**: Laravel 12 + PHP 8.3 (완성 상태, 그대로 사용 결정)
- **DB**: PostgreSQL 16 **독립 DB** (포트 5434, DB명: user_site_db)
- **Redis**: 포트 6380 (독립)
- **Admin**: Filament 3 (36 리소스) — user-site 전용 관리 도구

### user-site 개발 명령어

```bash
# Docker DB + Redis 기동
cd user-site && docker compose up postgres redis -d

# Backend (Laravel)
cd user-site/backend && php artisan serve --port=8003

# Frontend (한글 경로 → --webpack 필수!)
cd user-site/frontend && npx next dev --port 3002 --webpack

# DB 마이그레이션
cd user-site/backend && php artisan migrate --force

# Filament Admin: http://localhost:8003/admin
```

### user-site 포트 매핑

| 서비스 | 관리자 패널 | 유저 사이트 |
|--------|-------------|-------------|
| PostgreSQL | 5433 | **5434** |
| Redis | 6379 | **6380** |
| Backend | 8002 | **8003** |
| Frontend | 3001 | **3002** |

### user-site 기능 목록 (28페이지 + 80컴포넌트, 전부 완성)

| 기능 | 페이지 | 상태 |
|------|--------|------|
| 로그인/회원가입 | `/auth/login`, `/auth/register` | ✅ 완성 |
| 메인 대시보드 | `/(main)/` | ✅ 완성 |
| 게임 로비 | `/(main)/games` | ✅ 7개 프로바이더 연동 |
| 입금/출금 | `/(main)/profile/deposit`, `/withdraw` | ✅ 암호화폐 전용 (USDT/TRX/ETH/BTC/BNB) |
| 거래 내역 | `/(main)/profile/transactions` | ✅ 완성 |
| 스포츠 베팅 | `/(main)/sports` | ✅ PandaScore+TheOdds |
| 어필리에이트 | `/(main)/affiliate` | ✅ 워터폴 7게임 커미션 |
| VIP/미션/룰렛 | `/(main)/promotions/*` | ✅ 완성 |
| 출석체크 | `/(main)/attendance` | ✅ 완성 |
| 마이페이지 | `/(main)/profile/*` | ✅ 완성 |

### user-site 디렉토리 구조

```
user-site/
├── frontend/src/
│   ├── app/              # 28 페이지
│   │   ├── (main)/       # 인증 필요 페이지 (게임, 지갑, 스포츠, 프로모션)
│   │   ├── auth/         # 로그인, 회원가입, 비밀번호 찾기
│   │   └── api/          # NextAuth API 라우트
│   ├── components/       # 80+ 컴포넌트
│   │   ├── ui/           # 기본 UI (Button, Card, Modal 등)
│   │   ├── game/         # 게임 카드, 로비, 필터
│   │   ├── wallet/       # 입출금 폼
│   │   ├── sports/       # 스포츠 베팅 UI
│   │   ├── affiliate/    # 추천 대시보드
│   │   └── layout/       # Header, Footer, Sidebar
│   ├── stores/           # Zustand 8개 (auth, wallet, game, sports 등)
│   ├── types/            # TypeScript 인터페이스
│   └── lib/api.ts        # API 클라이언트 (Axios) ← 커스텀 시 핵심 수정 포인트
├── backend/              # Laravel 12 (PHP) — 원본 상태
│   ├── app/Models/       # 48 모델
│   ├── app/Services/     # 43 서비스
│   ├── app/Http/Controllers/ # 20+ 컨트롤러
│   └── routes/api.php    # 115 API 라우트
├── docker-compose.yml
└── deploy/
```

### Phase 진행 상태

| Phase | 작업 | 상태 |
|-------|------|------|
| P0 | 환경 설정 + DB 초기화 | ✅ 완료 (2026-02-19) |
| P1 | 브랜딩 + 한국어 커스텀 | ✅ 완료 (2026-02-19) |
| P2 | 인증 시스템 커스텀 | ✅ 완료 (2026-02-19) |
| P3 | 게임 연동 설정 | ✅ 완료 (2026-02-19) |
| P4 | 입출금 커스텀 (암호화폐 전용) | ✅ 완료 (2026-02-19) |
| P5 | 커미션/어필리에이트 (워터폴 + 7게임) | ✅ 완료 (2026-02-19) |
| P6 | 프로모션/VIP/미션 (한국형 커스텀) | ✅ 완료 (2026-02-19) |
| P7 | 통합 테스트 + 코드 품질 감사 | ✅ 완료 (2026-02-19) |

### user-site P4: 입출금 암호화폐 전용 전환 (2026-02-19)

Stripe/SuitPay/BsPay + PIX 결제 → 암호화폐 전용 입출금으로 전면 전환:
- **코인**: USDT(메인), TRX, ETH, BTC, BNB / **네트워크**: TRC20, ERC20, BEP20, BTC
- **마이그레이션**: `2026_02_19_200000_crypto_payment_customization.php`
  - deposits: coin_type, network, deposit_address 컬럼 추가
  - withdrawals: coin_type, network 컬럼 추가
  - withdrawal_addresses: coin_type 컬럼 추가
  - wallets/deposits/withdrawals: 기본 통화 BRL → KRW 변경
- **모델 수정**: Deposit, Withdrawal, WithdrawalAddress $fillable에 crypto 필드 추가
- **FormRequest 재작성**: DepositRequest, WithdrawRequest, StoreWithdrawalAddressRequest
  - PIX 필드 제거, crypto 필드 추가, 주소 형식 regex 검증, 한국어 메시지
- **서비스 수정**: DepositService(coinType/network 파라미터), WithdrawalService(crypto extra 필드)
- **컨트롤러 재작성**: WalletController(DEFAULT_NETWORKS 맵, crypto 파라미터), WithdrawalAddressController
- **리소스 수정**: DepositResource(coin_type/network/tx_hash), WithdrawalResource(PIX→crypto)
- **프론트엔드 타입**: Deposit, Withdrawal, WithdrawalAddress 인터페이스 crypto 필드
- **wallet-store**: createDeposit/createWithdrawal crypto 시그니처, 출금주소 CRUD 메서드
- **입금 페이지**: 5코인 선택, deposit_address 복사, 네트워크 경고, crypto 내역 테이블
- **출금 페이지**: 5코인 선택, 출금주소 인라인 관리(CRUD), 네트워크별 필터, 주소 truncate
- **거래내역/지갑 페이지**: 거래 유형 한국어 매핑
- **수정 파일**: 백엔드 12개, 프론트엔드 6개 (마이그레이션 1, 모델 3, Request 3, 서비스 2, 컨트롤러 2, 리소스 2, 타입 1, 스토어 1, 페이지 4)

### user-site P5: 커미션/어필리에이트 워터폴 시스템 (2026-02-19)

레거시 revshare/cpa 3단계 고정비율 → 관리자 패널 동일 수준의 워터폴 커미션 엔진으로 전면 전환:
- **커미션 유형**: 롤링(베팅금 %) + 죽장(손실금 %) - 7게임 카테고리별 독립 요율
- **게임 카테고리**: casino(1.5%), slot(5%), holdem(5%), sports(5%), shooting(5%), coin(5%), mini_game(3%)
- **워터폴 분배**: 무제한 계층, 각 에이전트 실제 수령률 = 자신 요율 - 자식 요율
- **검증 규칙**: 부모 천장(자식 ≤ 부모), 자식 바닥(부모 ≥ 자식), 최대율 제한, 순환 참조 방지
- **마이그레이션**: `2026_02_19_210000_p5_commission_affiliate_upgrade.php`
  - `game_commission_rates` 테이블 신규 (user_id + game_category UNIQUE)
  - `users` 테이블: commission_enabled, commission_type, losing_rate 추가
  - `commission_records` 테이블: game_category, level 컬럼 추가
  - `affiliate_withdrawals` 테이블: coin_type, network, wallet_address 추가
- **신규 모델**: `GameCommissionRate` (7카테고리 × 롤링/죽장 요율 + 최대값 상수)
- **AffiliateService 재설계**: 레거시 메서드 전면 제거 → 워터폴 엔진 핵심 3메서드
  - `processRollingCommission(bettor, betAmount, gameCategory)` - 베팅 시 자동 호출
  - `processLosingCommission(bettor, lossAmount, gameCategory)` - 손실 발생 시 호출
  - `calculateWaterfall(chain, baseAmount, gameCategory, type)` - 핵심 분배 알고리즘
- **API 변경**: `/affiliate/rates` 신규, withdraw PIX→crypto, commissions 필터(type+game_category)
- **프론트엔드 6탭**: 대시보드(게임별 커미션 현황), 커미션 요율(7게임 테이블), 추천 트리, 커미션 내역(필터), 추천인, 출금(암호화폐)
- **출금 UI**: PIX 필드 완전 제거, 5코인 선택(USDT/TRX/ETH/BTC/BNB), 네트워크 자동 매핑, 지갑 주소 입력
- **수정 파일**: 백엔드 8개 (마이그레이션 1, 모델 4, Request 1, 서비스 1, 컨트롤러 1, 라우트 1, 시더 2), 프론트엔드 4개 (타입 1, 스토어 1, 페이지 1, 컴포넌트 1)

### user-site P6: 프로모션/VIP/미션 한국형 커스텀 (2026-02-19)

기존 브라질 기반 프로모션 시스템 → 한국 시장 전면 커스텀:
- **통화 전환**: BRL → KRW (마이그레이션 + 시더 전체 적용)
- **VIP 10등급**: 브론즈~레전드, KRW 기준 베팅 요구액/보너스/캐시백 설정
- **미션 10종**: 일일 5개 + 주간 5개, 한국어 설명, KRW 보상
- **출석 30일**: 일반일 포인트(₩1,000~₩2,500), 주간/월간 보너스 캐시(₩10,000~₩100,000)
- **럭키스핀**: 8단계 상품 (꽝~₩500,000), 가중치 기반 확률
- **입금보너스**: 첫입금 100%(최대 ₩500,000), 매입금 10%(최대 ₩100,000) + 롤오버
- **페이백**: 일일 5%(최대 ₩500,000), 주간 10%(최대 ₩2,000,000)
- **추천이벤트**: 추천인 ₩10,000(캐시), 피추천인 ₩5,000(보너스), 최소입금 ₩50,000 조건
- **프로모션 허브**: Mock 데이터 → API(배너) + Fallback 구조, 카테고리 필터 유지
- **배너 모델 확장**: title, subtitle, category, gradient 컬럼 추가
- **마이그레이션**: `2026_02_19_220000_p6_promotion_krw_customization.php`
- **시더**: `PromotionSeeder.php` (VIP/미션/출석/스핀/보너스/페이백/추천/배너 7종)
- **수정 파일**: 백엔드 4개 (마이그레이션 1, 시더 2, 모델 1), 프론트엔드 3개 (타입 1, 스토어 1, 페이지 1)

### 알려진 이슈 (user-site)

- 한글 경로(관리자페이지) → Turbopack 크래시 → `--webpack` 필수
- PHP mongodb 모듈 중복 로드 경고 (무시 가능)
- DB 인증: user=casino, password=secret (docker-compose.yml 기준)

### 참고: 프로젝트 비교 (2026-02-19 분석)

유저 사이트 후보로 3개 프로젝트 비교 후 casino 선택:

| 프로젝트 | 위치 | 스택 | 선택 이유 |
|----------|------|------|-----------|
| **casino** ✅ | `~/Desktop/casino/` | Laravel 12 + **Next.js 15 + TS** | 관리자 패널과 동일 프론트 스택, 한국어 UI, 코드 품질 최고 |
| sol | `~/Desktop/sol/` | PHP절차적 + React (Vite) | 레거시, 코드 품질 낮음 |
| 벳리버 | `~/Desktop/벳리버/` | Laravel 11 + Vue 3 | Vue 스택 (React 아님), 영어 기반 |

## 커미션 시스템 강화 (2026-02-19)

- **커미션 타입 선택**: `commission_type` 컬럼 추가 (rolling / losing 택 1, 동시 불가)
- **죽장(losing) 요율**: `losing_rate` 컬럼 추가 (유저 레벨, 최대 50%)
- **커미션 토글**: `commission_enabled` 컬럼 추가 (유저별 커미션 ON/OFF)
- **롤링 최대값 검증**: 카지노 1.5%, 슬롯/홀덤/스포츠/슈팅/코인 5%, 미니게임 3%
- **계층 검증**: 자식 요율 ≤ 부모 요율 (롤링/죽장 모두 적용)
- **에이전트 관리 메뉴 제거**: 사이드바에서 삭제, 회원 상세 안으로 통합
- **마이그레이션**: `j0k1l2m3n4o5_add_losing_rate_commission_toggle.py`, `k1l2m3n4o5p6_commission_type_and_user_losing_rate.py`

## user-site P2: 인증 시스템 커스텀 (2026-02-19)

- **로그인**: 이메일 → 아이디(username) + 비밀번호, `POST /api/auth/login { login_id, password }`
- **회원가입**: username(영문소문자+숫자 4~20), nickname(2~20), phone(01XXXXXXXXX), password, inviter_code(필수)
- **이메일 제거**: 내부적으로 `username@user.local` 더미값 자동 생성 (Sanctum 호환)
- **소셜 로그인**: Telegram만 유지, Google/Facebook/Twitter/WhatsApp/Line 제거
- **비밀번호 정책**: 8자 이상, 영문+숫자 (대소문자 강제 없음)
- **IP 블랙리스트**: `CheckIpBlacklist` 미들웨어 API 그룹 활성화
- **UserResource**: `name/last_name` → `username/nickname` 반환
- **프로필 페이지**: 아이디/닉네임/전화번호/추천코드 표시
- **Validation**: 한국어 메시지 전면 적용 (로그인 5개, 회원가입 15개)
- **수정 파일 (백엔드)**: LoginRequest, RegisterRequest, AuthService, AuthController, SocialAuthController, UserResource, bootstrap/app.php
- **수정 파일 (프론트)**: auth-store.ts, login-form.tsx, register-form.tsx, social-login-buttons.tsx, layout.tsx, profile/page.tsx

## user-site P3: 게임 연동 설정 (2026-02-19)

- **카테고리 시드**: 7종목 (카지노/슬롯/홀덤/스포츠/슈팅/코인/미니게임) - `GameCategorySeeder.php`
- **프로바이더 시드**: 10개 프로바이더 (Evolution, Pragmatic Play, PG Soft 등) - `GameProviderSeeder.php`
- **언어 기본값**: 모든 프로바이더 `$lang = 'pt'` → `'ko'` 변경 (8개 파일)
  - GameProviderInterface, GameProviderService, FiversProvider, GambllyProvider, VibraProvider, Games2ApiProvider, KaGamingProvider, SlotegratorProvider, SalsaProvider, WorldSlotProvider
- **에러 메시지 한국어화**: GameController (7개), GameProviderService (3개), GambllyProvider (6개), FiversProvider (4개)
- **웹훅 라우트 확장**: 8개 프로바이더 전체 웹훅 엔드포인트 추가 (`/api/webhooks/game/{provider}`)
- **잔액 콜백 API**: `POST /api/game-callback/balance` 신규 엔드포인트
- **게임 상세 라우트**: `GET /api/games/{game}` 추가 (컨트롤러 존재했으나 라우트 누락)
- **프론트엔드 커스텀**:
  - mock 데이터 완전 제거 (mockBigWins, mockLiveSports, mockProviders)
  - 프로바이더 섹션 실제 API 연동 + 로딩 스켈레톤
  - "최근 플레이 게임" 기능 추가 (localStorage 영속화, 최대 10개)
  - 게임 점검 모드 오버레이 ("점검 중" 표시, 클릭 차단)
  - 서브카테고리 7개 한국 시장 기준으로 갱신
  - Provider 타입에 `distribution`, `games_count` 필드 추가
- **수정 파일 (백엔드)**: GameProviderInterface, GameProviderService, GameController, GameWebhookController, routes/api.php, 8개 프로바이더, 2개 시더, DatabaseSeeder
- **수정 파일 (프론트)**: game-lobby.tsx, game-card.tsx, game-store.ts, types/index.ts

### user-site P7: 통합 테스트 + 코드 품질 감사 (2026-02-19)

4개 전문 에이전트 병렬 전수 분석 → CRITICAL/HIGH 이슈 수정 → 빌드 검증 완료:

**분석 범위**:
- 백엔드: 21 컨트롤러 + 43 서비스 전수 분석
- 프론트엔드: 25 페이지 + 80 컴포넌트 전수 분석
- 보안: OWASP Top 10 프레임워크 기반 감사 (점수: 72→85/100)
- DB: 75 테이블 + 26 마이그레이션 + 49 모델 + 9 시더 전수 검증

**발견 및 수정 이슈**: 총 98건 (CRITICAL 16, HIGH 29, MEDIUM 37, LOW 16)

**CRITICAL 수정 (5건)**:
1. AffiliateService: `commission_type` 필터 누락 → 롤링/죽장 유형별 지급 검증 추가
2. AffiliateService: 멱등성 레이스컨디션 → `lockForUpdate()` 원자적 검증으로 변경
3. SpinService: 일일 스핀 한도 우회 → 트랜잭션 내부 재검증 + `lockForUpdate()`
4. MissionService: 진행/보상 이중 지급 → `updateProgress()`, `claimReward()` 모두 `lockForUpdate()` 적용
5. GameWebhookController: `balanceCallback` IDOR → HMAC-SHA256 서명 검증 + user_id 형식 검증

**HIGH 수정 (6건)**:
1. API fallback 포트: `8000` → `8003` (docker-compose 매핑 일치)
2. AffiliateWithdrawal: 레거시 PIX 필드(pix_key/pix_type/bank_info) `$fillable`에서 제거
3. GameCategorySeeder: slug 불일치 `slots`→`slot`, `minigame`→`mini_game` (GameCommissionRate 상수와 통일)
4. DatabaseSeeder: GameCommissionRateSeeder 호출 순서를 admin 유저 생성 이후로 이동
5. middleware.ts: 보호 경로 누락 `/messages`, `/attendance`, `/support` 추가
6. AffiliateService: N+1 쿼리 → `User::whereIn()` 배치 로딩으로 최적화

**미수정 잔여 이슈** (배포 시 대응):
- MEDIUM 37건: BRL 기본값 잔존(6), 레거시 테이블(2), CHECK 제약(1) 등
- LOW 16건: 언어 기본값, CPF 컬럼, 타입 캐스트 불일치 등
- 프로덕션 필수: `.env`에서 `APP_DEBUG=false` 설정, APP_KEY 재생성

**수정 파일 (백엔드 6개)**: AffiliateService, SpinService, MissionService, GameWebhookController, AffiliateWithdrawal, GameCategorySeeder, DatabaseSeeder
**수정 파일 (프론트엔드 2개)**: middleware.ts, lib/api.ts
**빌드 검증**: Next.js 28페이지 전체 프로덕션 빌드 성공

## RapidAPI 외부 게임/스포츠 API 통합 (2026-02-24 시작)

> **계획서**: `docs/plans/2026-02-24-rapidapi-integration-plan.md`
> **API 문서**: `API-REFERENCE.md`
> **현재 Phase**: Phase 0 (기반 인프라) 준비 중

### 사용 가능한 외부 API (3개 Working + 1개 Partial)

| API | 호스트 | 무료 쿼터 | 용도 |
|-----|--------|-----------|------|
| **Odds Feed** | odds-feed.p.rapidapi.com | 500/월 | 스포츠 배당률 (7개 북메이커) |
| **SportAPI7** | sportapi7.p.rapidapi.com | 50/월 | 실시간 스포츠 (20+ 종목) |
| **Casino & Slots** | live-casino-slots-...rapidapi.com | 299/월 | 카지노/슬롯 (100+ 프로바이더) |

### 핵심 설계 결정

- **프록시 구조**: Admin Backend → RapidAPI → 유저사이트 (API Key 보호)
- **캐싱 전략**: Redis TTL (프로바이더 24h, 게임 1h, 라이브 30s, 배당률 15s)
- **쿼터 관리**: Redis 월별 카운터 + 80%/95%/100% 경고/차단
- **기존 패턴 재활용**: BaseConnector 어댑터 패턴에 RapidAPI 커넥터 추가
- **환경변수**: `RAPIDAPI_KEY`, `RAPIDAPI_{API}_QUOTA` (.env)

### 6 Phase 구조 (총 20 Task)

| Phase | 내용 | 우선순위 | 상태 |
|-------|------|----------|------|
| 0 | 기반 인프라 (클라이언트+캐싱+쿼터) | CRITICAL | ⬜ |
| 1 | 카지노 & 슬롯 API 통합 (100+ 프로바이더) | P0 | ⬜ |
| 2 | 스포츠 배당 API (Odds Feed) | P1 | ⬜ |
| 3 | 실시간 스포츠 (SportAPI7) | P1 | ⬜ |
| 4 | 관리자 모니터링 대시보드 | P2 | ⬜ |
| 5 | 유저사이트 연동 + E2E 검증 | P2 | ⬜ |

### 신규 파일 (예정)

- `backend/app/services/rapidapi_client.py` - 공통 HTTP 클라이언트
- `backend/app/services/quota_service.py` - 쿼터 관리
- `backend/app/connectors/rapidapi_casino_connector.py` - 카지노 커넥터
- `backend/app/connectors/rapidapi_sports_connector.py` - 스포츠 커넥터
- `backend/app/api/v1/external_api.py` - 통합 라우터
- `backend/app/services/sports_aggregator.py` - 스포츠 데이터 통합
- `frontend/src/app/dashboard/external-api/page.tsx` - 모니터링 UI
- `frontend/src/app/dashboard/sports-monitor/page.tsx` - 스포츠 모니터링

### 비용 전략

- **현재**: $0/월 (무료 플랜, 캐싱으로 운용)
- **유저사이트 오픈 시**: $20/월 (Odds Pro $5 + SportAPI7 Pro $15)
- **대규모 유입 시**: Casino Ultra $999/월 필요 (게임 런칭 폭증 시)

## user-page (유저 게임 플랫폼) - 2026-02-24 완료

> **계획서**: `docs/plans/2026-02-24-user-page-implementation-plan.md`
> **결과**: Phase 0~9 전체 완료 | Backend 47 routes (7 모듈) | Frontend 23 pages
> **테스트 계정**: testuser / test1234!

### user-page 기술 스택

- **모노레포**: Turborepo (backend, frontend, shared)
- **Backend**: Fastify 5 + TypeScript (ESM) + Prisma 6 + PostgreSQL 16 + Redis 7
- **Frontend**: Next.js 16.1.6 (App Router) + React 19 + TailwindCSS 4 + shadcn/ui + Zustand
- **인증**: JWT HS256 (access 15min, refresh 7day) + Redis blacklist + bcrypt + Zod

### user-page 포트 매핑

| 서비스 | 관리자 패널 | 유저 페이지 |
|--------|-------------|-------------|
| PostgreSQL | 5433 | **5435** |
| Redis | 6379 | **6381** |
| Backend | 8002 | **8003** |
| Frontend | 3001 | **3002** |

### user-page 개발 명령어

```bash
# Docker DB+Redis 기동
cd user-page && docker compose up -d

# Backend 개발
cd user-page/backend && npm run dev

# Frontend 개발 (한글 경로 → --webpack 필수!)
cd user-page/frontend && npx next dev --port 3002 --webpack

# Frontend 빌드
cd user-page/frontend && npx next build --webpack

# DB 마이그레이션
cd user-page/backend && npx prisma migrate deploy

# 시드 데이터
cd user-page/backend && npm run seed
```

### user-page 백엔드 라우트 (7 모듈, 47 엔드포인트)

| 모듈 | 엔드포인트 수 | 주요 기능 |
|------|--------------|-----------|
| health | 2 | /, /health |
| auth | 4 | register, login, refresh, logout |
| games | 8 | categories, providers, search, popular, recent, launch, demo |
| wallet | 8 | balance, addresses CRUD, deposit, withdraw, transactions |
| events | 12 | attendance, missions, spin, promotions, VIP, points |
| sports | 5 | events, odds, categories, esports live/categories |
| profile | 17 | profile CRUD, password, history, affiliate, messages, inquiries |

### user-page 프론트엔드 라우트 (23 페이지)

```
/, /games, /login, /register
/wallet/deposit, /wallet/withdraw, /wallet/transactions
/promotions, /promotions/attendance, /promotions/missions, /promotions/spin, /promotions/vip, /promotions/points
/sports, /sports/esports
/profile, /profile/bets, /profile/money, /profile/login-history
/affiliate, /messages, /support
```

### user-page DB 스키마 (25 모델)

User, LoginHistory, RefreshToken, WalletAddress, Deposit, Withdrawal,
GameCategoryConfig, GameProvider, Game, BetRecord, GameRollingRate,
MoneyLog, PointLog, CommissionRecord,
AttendanceConfig, AttendanceLog, MissionConfig, MissionProgress,
SpinConfig, SpinLog, PaybackConfig, PromotionConfig, UserPromotion,
VipLevel, Message, Inquiry, InquiryReply

### user-page Phase 진행 상태 (전체 완료)

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | 모노레포 + Docker + Fastify + Next.js 초기화 | ✅ |
| 1 | Prisma 스키마 (25 모델) + 시드 데이터 | ✅ |
| 2 | JWT 인증 + 회원가입/로그인 | ✅ |
| 3 | 다크 테마 + 레이아웃 + 로그인/회원가입 UI | ✅ |
| 4 | 게임 로비 + 런칭 | ✅ |
| 5 | 지갑 (입금/출금/거래내역) | ✅ |
| 6 | 이벤트/보상 (출석/미션/스핀/VIP/포인트) | ✅ |
| 7 | 스포츠 베팅 (Mock 데이터) | ✅ |
| 8 | 마이페이지/추천/쪽지/고객센터 | ✅ |
| 9 | 통합 테스트 + Docker + 보안 + 인수인계 | ✅ |

### user-page 디렉토리 구조

```
user-page/
├── docker-compose.yml              # PostgreSQL 16 + Redis 7
├── turbo.json                      # Turborepo 설정
├── shared/types/                   # 프론트+백엔드 공유 타입
├── backend/
│   ├── prisma/schema.prisma        # 25 모델
│   ├── prisma/seed.ts              # 시드 데이터
│   └── src/
│       ├── index.ts                # Fastify 진입점
│       ├── plugins/                # auth, redis, prisma, cors
│       ├── routes/                 # 7 모듈 라우트
│       ├── services/               # 비즈니스 로직
│       └── middleware/             # auth-guard, rate-limit
├── frontend/
│   └── src/
│       ├── app/                    # 23 페이지 (App Router)
│       ├── components/             # UI, layout, game, wallet, sports, promotion
│       ├── stores/                 # Zustand (auth, game, wallet, notification)
│       ├── hooks/                  # use-auth, use-games, use-wallet, use-sports
│       └── lib/                    # api-client, utils, constants
```

### user-page 알려진 이슈

- 한글 경로(관리자페이지) → Turbopack 크래시 → `--webpack` 필수
- 스포츠 데이터는 Mock (RapidAPI 연동은 별도 계획서)
- DB 인증: userpage/secret (docker-compose.yml 기준)

## 인수인계 문서

Phase 0~13 완료 문서: `docs/handoff/phase-{0..13}-handoff.md`
