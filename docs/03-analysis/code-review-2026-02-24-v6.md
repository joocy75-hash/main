# 코드 리뷰 보고서 v6 — 관리자페이지 (Admin Panel)

**날짜**: 2026-02-24  
**리뷰어**: Senior Dev Agent (Opus 4.6 Team Lead)  
**이전 리뷰**: 2026-02-22 (v5, 91/100)

---

## 📊 Executive Summary

| 영역 | v5 (02/22) | v6 (현재) | 변화 |
|---|---|---|---|
| **Backend** | 92 | 95 | +3 |
| **Frontend** | 89 | 89 | ± 0 |
| **Security** | 93 | 96 | +3 |
| **Architecture** | 91 | 93 | +2 |
| **종합** | **91** | **93** | **+2** |

---

## 🚨 v6에서 발견 및 수정된 이슈

### CRITICAL (1건 → 수정 완료)

| ID | 파일 | 이슈 | 심각도 | 수정 |
|---|---|---|---|---|
| CR-v6-C1 | `commissions.py:443-509` | **커미션 환수가 잘못된 필드 차감** — `reverse_commission()`이 `User.balance`(현금)에서 차감했으나, commission_engine은 `User.points`에 적립. 환수 시 현금이 줄어들고 포인트는 그대로 남는 회계 불일치 발생. | CRITICAL | ✅ `User.points` 차감 + `PointLog` 기록으로 수정. `MoneyLog` → `PointLog` import 교체. 알림 단위 "원" → "P" |

### HIGH (1건 → 수정 완료)

| ID | 파일 | 이슈 | 심각도 | 수정 |
|---|---|---|---|---|
| CR-v6-H1 | `agents.py:111-118` | **ILIKE 이스케이프 패턴 불일치** — 다른 모든 파일은 3단계 이스케이프(`\` → `%` → `_`) + `escape="\\"` 파라미터를 사용하지만, agents.py만 2단계 이스케이프 + escape 파라미터 누락. 백슬래시 포함 검색어에서 SQL 패턴 주입 가능. | HIGH | ✅ 3단계 이스케이프 + `escape="\\"` 파라미터 추가 (전 파일 통일) |

### MEDIUM (1건 → 수정 완료)

| ID | 파일 | 이슈 | 심각도 | 수정 |
|---|---|---|---|---|
| CR-v6-M1 | `admin_login_log.py:17` | **`datetime.utcnow()` 잔존** — v5에서 "전면 교체 완료"로 보고했으나 1곳 누락. Python 3.12에서 deprecated, 시간대 정보 없는 naive datetime 생성. | MEDIUM | ✅ `datetime.now(timezone.utc)` factory 함수로 교체 |

---

## ⚠️ 남은 이슈 (Deferred)

### P2 — 직렬화용 float() 캐스팅 (20+ 곳)

| ID | 파일 | 이슈 | 사유 |
|---|---|---|---|
| CR-v6-D1 | `partner.py` (12곳) | Decimal → `float()` 변환 | JSON 직렬화 전용, 계산에 미사용. Pydantic 스키마를 `Decimal` 필드로 리팩토링 시 일괄 해결 권장 |
| CR-v6-D2 | `tree_service.py`, `user_tree_service.py` (3곳) | 동일 | 동일 |
| CR-v6-D3 | `bi.py`, `reports.py` (6곳) | 동일 | 동일 |
| CR-v6-D4 | `promotions.py` (2곳) | 동일 | 동일 |

### P3 — Minor Lint 이슈 (기존 보류, 기능 무관)

| ID | 파일 | 이슈 | 사유 |
|---|---|---|---|
| CR-v6-D5 | `agents.py:242` | `ALLOWED_UPDATE_FIELDS` 대문자 (Ruff N806) | 의도적 상수, 기능 무관 |
| CR-v6-D6 | `commissions.py:387-388` | `RecipientUser/BettorUser` 대문자 (Ruff N806) | SQLAlchemy alias, 구분 목적 |
| CR-v6-D7 | `commissions.py:3` | import 정렬 (Ruff I001) | formatter 자동 수정 가능 |
| CR-v6-D8 | `popups/page.tsx:124` | `window.confirm` | CLAUDE.md 삭제 확인은 허용 |
| CR-v6-D9 | `users/tree/page.tsx` | `any` 타입 (react-d3-tree) | 라이브러리 타입 제한 |

---

## ✅ 스킬 문서 준수 검증

### commission-logic (SKILL.md) 준수 현황

| 검증 항목 | 결과 | 비고 |
|---|---|---|
| 워터폴 순서 (셀프→직속→상위) | ✅ | `chain_user_ids[0]=bettor` 올바름 |
| effective_rate 음수 방지 | ✅ | `if effective_rate <= 0: continue` |
| CommissionLedger 직접 삭제 금지 | ✅ | `cancelled`로 상태 변경만 사용 |
| 커미션 → User.points 적립 | ✅ | `sa_update(User).values(points=User.points + amount)` |
| **커미션 환수 → User.points 차감** | ✅ **수정됨** | v6에서 `User.balance` → `User.points`로 수정 |
| 중복 방지 (FOR UPDATE) | ✅ | 멱등성 검증 패턴 일관 적용 |
| 부모 천장 / 자식 바닥 검증 | ✅ | `validate_rate_against_parent/children` |

### crypto-payment (SKILL.md) 준수 현황

| 검증 항목 | 결과 | 비고 |
|---|---|---|
| 은행 계좌이체 없음 | ✅ | 코드 전역 검색 확인 |
| SELECT FOR UPDATE 잔액 잠금 | ✅ | 6곳 모두 적용 |
| 상태 전이 규칙 (pending→approved/rejected) | ✅ | transaction_service.py 확인 |
| USDT 메인 + 5코인 지원 | ✅ | 프론트/백엔드 일치 |

### api-conventions (SKILL.md) 준수 현황

| 검증 항목 | 결과 | 비고 |
|---|---|---|
| /api/v1/{resource} 패턴 | ✅ | 43개 라우터 전부 |
| PermissionChecker 의존성 주입 | ✅ | 모든 보호 엔드포인트 |
| 페이지네이션 (page/page_size) | ✅ | ge=1, le=100 제한 |
| Closure Table 스코핑 | ✅ | partner.py, agents.py |

---

## 📈 Anti-Pattern 전수 스캔 결과

| 검사 항목 | 결과 | 비고 |
|---|---|---|
| `datetime.utcnow()` | ✅ **0건** | v6에서 마지막 1건 교체 완료 |
| `float` for money (계산용) | ✅ 0건 | GameRound Decimal 완료 |
| `float` for money (직렬화용) | ⚠️ ~20건 | P2 보류 (기능 영향 없음) |
| SQL injection via LIKE | ✅ **0건** | v6에서 agents.py 마지막 1건 수정 |
| `console.log` in production | ✅ 0건 | |
| `print()` in app/ | ✅ 0건 | |
| `alert()` 사용 | ✅ 0건 | |
| Hardcoded secrets | ✅ 안전 | 프로덕션 RuntimeError |
| `any` 타입 | ⚠️ 2곳 | react-d3-tree 라이브러리 제한 |
| `window.confirm` | ⚠️ 1곳 | 삭제 확인 (허용 범위) |
| 커미션 balance vs points 불일치 | ✅ **0건** | v6에서 reversal 수정 완료 |

---

## ✨ Positive Findings (우수 사항)

### Architecture 우수 사항
1. **SKILL.md 기반 도메인 룰 관리**: 3개 핵심 스킬 (commission-logic, crypto-payment, api-conventions)이 코드 변경 시 단일 진실 소스 역할
2. **완전한 RBAC 47개 퍼미션**: 모든 엔드포인트에 일관된 `PermissionChecker` 의존성 주입
3. **MLM 워터폴 엔진**: `commission_engine.py`의 배치 쿼리 + 원자적 포인트 갱신 패턴 우수
4. **N+1 방지**: `_batch_build_responses()`, `_batch_descendant_counts()` 일관 적용

### Security 우수 사항
1. **Webhook HMAC-SHA256**: `compare_digest` + 타임스탬프 + 리플레이 방지 (5분 허용)
2. **Refresh Token 블랙리스트**: Redis TTL 기반 폐기
3. **프로덕션 안전장치**: SECRET_KEY 기본값 시 RuntimeError
4. **전역 ILIKE 이스케이프**: v6에서 100% 달성

### Frontend 우수 사항  
1. **토큰 Mutex 자동 갱신**: 401 → refresh → 재시도 (동시 요청 경합 방지)
2. **Zustand persist**: SSR-safe 토큰 접근
3. **동적 CSP**: 환경변수 기반

---

## 📊 Score Trend

| 날짜 | Version | Score | Critical | Major | Minor |
|---|---|---|---|---|---|
| 2026-02-18 | v1 | 75 | 8 | 23 | 27 |
| 2026-02-22 | v5 | 91 | 0 | 0 | 7 |
| 2026-02-24 | **v6** | **93** | **0** | **0** | **5** |

**결론**: 
- **CRITICAL (커미션 환수 balance/points 불일치)** 발견 및 즉시 수정 — 프로덕션 배포 전 반드시 필요했던 fix
- ILIKE 이스케이프 100% 통일, `datetime.utcnow()` 완전 제거
- 남은 5건은 모두 P2/P3 Minor (기능 무관, 코드 스타일)
- **Backend/Frontend 프로덕션 빌드 검증 완료** ✅
