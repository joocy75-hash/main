# 양방향 운영 기능 완성 + 이벤트 지급 엔진 구현 계획서

> **작성일**: 2026-02-20
> **작성자**: Senior Dev (Opus 4.6 Agent Team)
> **우선순위**: P0 (시스템 핵심 운영 기능)
> **감사 결과**: 10개 항목 중 4.5개만 완성 → **완성도 45%를 100%로**

---

## 0. 감사 결과 요약 (현재 상태)

| # | 기능 | 현재 상태 | 목표 |
|---|------|-----------|------|
| 1 | 회원가입 승인/거절 | ❌ 미구현 | ✅ 추천코드 필수 + 자동승인 |
| 2 | 회원 활성화/비활성화 | △ activate 전용 API 없음 | ✅ 전용 API 쌍 |
| 3 | 입금 승인/거절 | ✅ 완벽 | 유지 + 자동승인 룰 추가 |
| 4 | 출금 승인/거절 | ✅ 완벽 | 유지 + 자동승인 룰 추가 |
| 5 | 이벤트 자동 포인트 지급 | ❌ 설정만, 엔진 없음 | ✅ 혼합형 지급 엔진 |
| 6 | 보상 지급 후 쪽지 알림 | ❌ 미구현 | ✅ 자동 + 대량 발송 |
| 7 | IP 활성화/비활성화 | ✅ 완벽 | 유지 |
| 8 | 강제 로그아웃 | ❌ 미구현 | ✅ 구현 |
| 9 | 잔액 지급/차감 | ✅ 완벽 | 유지 |
| 10 | 포인트 지급/차감 | △ 일괄만 | ✅ 단건 + 일괄 |

### 추가 양방향 누락

| 패턴 | 지급(+) | 회수(-) | 목표 |
|------|---------|---------|------|
| 프로모션 보너스 | claim 레코드만 | 없음 | ✅ 실제 반영 + 회수 |
| 쿠폰 | redeem | 취소 없음 | ✅ 취소 API |
| 커미션 | 워터폴 지급 | 환수 없음 | ✅ 정정/환수 |

---

## 1. 설계 결정사항

### 1-1. 회원가입 방식
- **추천코드 필수 + 자동승인**
- 추천코드 없으면 가입 자체 불가 (API 레벨 거절)
- 추천코드 유효하면 즉시 `active` 상태
- 가입 시 추천인에게 쪽지 알림
- 관리자에게 텔레그램 + 관리자 알림 발송

### 1-2. 이벤트 자동 지급 방식
- **혼합형 (금액 기준)**
- `auto_approve_threshold` 설정값 이하 → 즉시 자동 지급
- 초과 → `pending` 상태 생성, 관리자 승인 필요
- 기본 임계값: 포인트 50,000 / 캐시 100,000
- 모든 지급 후 **자동 쪽지 알림** 발송

### 1-3. 추가 기능
- 대량 쪽지 발송 (전체/등급별/상태별)
- 입출금 자동 승인 룰 엔진
- 회원 메모 이력 관리

---

## 2. Phase 구조 (5 Phase, 총 18 Task)

```
Phase 1: 핵심 양방향 API (회원/포인트/로그아웃) ← Day 1
Phase 2: 보상 지급 엔진 (출석/미션/스핀/페이백) ← Day 2
Phase 3: 쪽지 알림 시스템 (자동 알림 + 대량 발송) ← Day 3
Phase 4: 회수/취소 (프로모션/쿠폰/커미션)       ← Day 4
Phase 5: 자동 승인 룰 + 메모 이력               ← Day 5
```

---

## Phase 1: 핵심 양방향 API (CRITICAL)

> **목표**: 운영에 즉시 필요한 ON/OFF 쌍 기능 완성
> **검증**: 각 API curl 테스트 + 프론트엔드 연동 확인

### Task 1-1: 회원가입 추천코드 필수 + 자동승인

**백엔드 변경:**
- `POST /users` (create_user) 수정:
  - `referrer_code` → 필수 파라미터로 변경 (None 불가)
  - 추천코드 미입력 시 400 에러 ("추천코드는 필수입니다")
  - 추천코드 유효 → 즉시 `status="active"`
  - 가입 후 추천인에게 쪽지 발송: "새로운 추천 회원 {username}이 가입했습니다"
- `UserCreate` 스키마: `referrer_code: str` (Optional 제거)

**프론트엔드 변경:**
- 회원 생성 폼에서 추천코드 필수 표시 (빨간 *)
- 회원 목록에서 `pending` 상태 필터 제거 (더 이상 pending 없음)

**검증 체크리스트:**
- [ ] 추천코드 없이 가입 시도 → 400 에러
- [ ] 유효한 추천코드로 가입 → active 상태
- [ ] 잘못된 추천코드 → 400 에러
- [ ] 가입 후 추천인 쪽지 확인
- [ ] 텔레그램 알림 발송 확인

### Task 1-2: 회원 활성화/정지 전용 API 쌍

**백엔드 추가:**
```
POST /users/{id}/activate   → status를 "active"로 변경
POST /users/{id}/suspend     → 기존 (이미 있음)
POST /users/{id}/ban         → status를 "banned"로 변경 (신규)
```

**각 API 공통 로직:**
- 상태 변경 + `updated_at` 갱신
- 변경 시 쪽지 알림 발송 (정지/차단 사유 포함)
- AuditLog 기록

**프론트엔드 변경:**
- 회원 상세 헤더에 [활성화] [정지] [차단] 버튼 3개
- 현재 상태에 따라 비활성화 (active면 활성화 버튼 disabled)
- 정지/차단 시 사유 입력 모달

**검증 체크리스트:**
- [ ] suspended → activate → active 전환
- [ ] active → suspend → suspended 전환
- [ ] active → ban → banned 전환
- [ ] 동일 상태 재요청 시 적절한 에러
- [ ] 상태 변경 쪽지 발송 확인

### Task 1-3: 포인트 단건 지급/차감 전용 API

**백엔드 추가:**
```
POST /finance/point-adjustment
  body: { user_id, action: "credit"|"debit", amount, memo }
```

**로직:**
- `SELECT FOR UPDATE` 동시성 보호
- debit 시 잔여 포인트 부족 체크
- PointLog 기록 (type="admin_adjustment")
- 변경 후 쪽지 알림: "포인트 {amount}P가 {지급/차감}되었습니다. 사유: {memo}"

**프론트엔드 변경:**
- 회원 상세 > 포인트 탭에 [포인트 지급] [포인트 차감] 버튼 추가
- 금액 + 사유 입력 모달

**검증 체크리스트:**
- [ ] 포인트 지급 → user.points 증가 + PointLog 생성
- [ ] 포인트 차감 → user.points 감소 + PointLog 생성
- [ ] 잔여 부족 시 차감 에러
- [ ] 쪽지 발송 확인

### Task 1-4: 회원 강제 로그아웃

**백엔드 추가:**
```
POST /users/{id}/force-logout
```

**로직:**
- User 모델에 `force_logout_at: datetime | None` 컬럼 추가
- 강제 로그아웃 시 `force_logout_at = now()` 기록
- **토큰 검증 미들웨어** 수정: 토큰의 `iat` < `force_logout_at` 이면 401 반환
- Redis에 `force_logout:{user_id}` 키 설정 (TTL = 토큰 만료 시간)
- 대상 회원에게 쪽지: "관리자에 의해 로그아웃 되었습니다"

**프론트엔드 변경:**
- 회원 상세 헤더에 [강제 로그아웃] 버튼 추가
- 확인 모달 ("이 회원을 강제 로그아웃 하시겠습니까?")

**검증 체크리스트:**
- [ ] 강제 로그아웃 후 해당 유저 API 호출 → 401
- [ ] 재로그인 후 정상 동작
- [ ] force_logout_at 기록 확인
- [ ] 쪽지 발송 확인

---

## Phase 2: 보상 지급 엔진 (CRITICAL)

> **목표**: 현재 "설정만 있고 실행이 없는" 이벤트 시스템에 실제 지급 로직 추가
> **핵심 설계**: 공통 RewardEngine 서비스 → 각 이벤트 모듈에서 호출
> **검증**: 각 이벤트 트리거 → 포인트/잔액 변동 + PointLog/MoneyLog + 쪽지 확인

### Task 2-1: 공통 보상 지급 서비스 (RewardEngine)

**신규 파일:** `backend/app/services/reward_engine.py`

```python
class RewardEngine:
    """모든 보상 지급의 단일 진입점"""

    async def grant_reward(
        session, user_id, amount, reward_type,  # "point" | "cash" | "bonus"
        source,        # "attendance" | "mission" | "spin" | "payback" | "promotion"
        description,   # 한국어 설명
        auto_approve_threshold=None,  # None이면 설정값 사용
    ) -> RewardResult:
        # 1. 임계값 체크 (혼합형)
        threshold = auto_approve_threshold or get_config_threshold(reward_type)
        needs_approval = amount > threshold

        if needs_approval:
            # pending 상태로 PendingReward 생성
            return RewardResult(status="pending", pending_id=...)

        # 2. 즉시 지급
        if reward_type == "point":
            user.points += amount → PointLog 기록
        elif reward_type in ("cash", "bonus"):
            user.balance += amount → MoneyLog 기록

        # 3. 쪽지 알림 발송
        create_message(user_id, title, content)

        # 4. 텔레그램 알림 (고액)
        if amount > large_threshold:
            notify_telegram(...)

        return RewardResult(status="granted", amount=amount)
```

**PendingReward 모델 (신규 테이블):**
```
pending_rewards:
  id, user_id, amount, reward_type, source, description,
  status (pending/approved/rejected),
  created_at, processed_by, processed_at
```

**관리자 API (PendingReward 관리):**
```
GET    /rewards/pending          → 대기 중인 보상 목록
POST   /rewards/{id}/approve     → 승인 (실제 지급)
POST   /rewards/{id}/reject      → 거절 (사유 쪽지 발송)
```

**검증 체크리스트:**
- [ ] 임계값 이하 금액 → 즉시 지급 + 쪽지
- [ ] 임계값 초과 금액 → pending 생성
- [ ] pending 승인 → 실제 지급 + 쪽지
- [ ] pending 거절 → 사유 쪽지 발송
- [ ] PointLog / MoneyLog 정확한 기록

### Task 2-2: 출석 체크 지급 연동

**백엔드 추가:**
```
POST /attendance/check-in
  body: { user_id }
```

**로직:**
1. 오늘 이미 출석했는지 체크 (중복 방지)
2. 연속 출석일 계산
3. `attendance_configs` 에서 해당 일차 보상 조회
4. `RewardEngine.grant_reward()` 호출
5. 결과 반환

**신규 테이블:** `user_attendance_logs` (user_id, check_in_date, day_number, reward_amount, reward_type)

**검증 체크리스트:**
- [ ] 첫 출석 → 1일차 보상 지급
- [ ] 연속 출석 → 연속일수 보상 지급
- [ ] 당일 중복 출석 → 400 에러
- [ ] 보상 금액 > 임계값 → pending 생성

### Task 2-3: 미션 완료 지급 연동

**백엔드 추가:**
```
POST /missions/{id}/complete
  body: { user_id }
POST /missions/{id}/claim
  body: { user_id }
```

**로직:**
1. complete: 미션 완료 조건 체크 → `user_missions` status="completed"
2. claim: 보상 수령 → `RewardEngine.grant_reward()` 호출
3. `user_missions` status="claimed"

**신규 테이블:** `user_missions` (user_id, mission_id, progress, status, completed_at, claimed_at)

**검증 체크리스트:**
- [ ] 미션 완료 → status=completed
- [ ] 보상 수령 → 포인트/잔액 지급 + status=claimed
- [ ] 중복 수령 방지
- [ ] 미완료 미션 claim 시 에러

### Task 2-4: 스핀 보상 지급 연동

**백엔드 추가:**
```
POST /spin/execute
  body: { user_id }
```

**로직:**
1. 일일 스핀 횟수 체크 (spin_configs의 max_daily)
2. 가중치 기반 확률 계산 → 당첨 항목 결정
3. `RewardEngine.grant_reward()` 호출
4. 스핀 기록 저장

**신규 테이블:** `user_spin_logs` (user_id, spin_date, prize_name, amount, reward_type)

**검증 체크리스트:**
- [ ] 스핀 실행 → 확률 기반 당첨 + 보상 지급
- [ ] 일일 한도 초과 → 400 에러
- [ ] 꽝 당첨 시 → 0원 기록, 쪽지 없음

### Task 2-5: 페이백 자동 계산/지급

**백엔드 추가:**
```
POST /payback/calculate
  body: { user_id, period: "daily"|"weekly" }
```

**로직:**
1. 기간 내 순손실 계산: total_bet - total_win (음수면 손실)
2. 페이백 설정에서 비율/최대값 조회
3. 페이백 금액 = 순손실 × 비율 (최대값 캡)
4. `RewardEngine.grant_reward()` 호출

**검증 체크리스트:**
- [ ] 손실 회원 → 페이백 지급
- [ ] 수익 회원 → 페이백 0 (지급 안 함)
- [ ] 최대값 캡 적용 확인
- [ ] 중복 지급 방지 (기간별 1회)

### Task 2-6: 프로모션 claim 시 실제 잔액/포인트 반영

**기존 코드 수정:** `backend/app/api/v1/promotions.py` → `claim_promotion`

**현재 문제:** `UserPromotion` 레코드만 생성, `user.balance`에 반영 안 함

**수정 로직:**
1. 기존 claim 로직 유지
2. `RewardEngine.grant_reward()` 추가 호출
3. 보너스를 실제 잔액에 반영

**검증 체크리스트:**
- [ ] claim 후 user.balance 증가 확인
- [ ] MoneyLog/PointLog 기록 확인
- [ ] 쪽지 발송 확인

---

## Phase 3: 쪽지 알림 시스템 (HIGH)

> **목표**: 모든 보상/상태변경에 자동 쪽지 + 대량 공지 발송
> **검증**: 각 이벤트 트리거 → Message 테이블에 정확한 레코드 생성

### Task 3-1: 자동 쪽지 알림 서비스

**신규 파일:** `backend/app/services/message_service.py`

```python
class MessageService:
    """모든 자동 쪽지의 단일 진입점"""

    TEMPLATES = {
        "reward_granted": "🎉 {source} 보상 {amount}{unit} 지급 완료",
        "reward_pending": "⏳ {source} 보상 {amount}{unit} 승인 대기 중",
        "reward_rejected": "❌ {source} 보상 거절 - 사유: {reason}",
        "status_changed": "ℹ️ 계정 상태가 {status}(으)로 변경되었습니다",
        "force_logout": "🔒 관리자에 의해 로그아웃 처리되었습니다",
        "deposit_approved": "✅ 입금 {amount} USDT 승인되었습니다",
        "withdrawal_approved": "✅ 출금 {amount} USDT 승인되었습니다",
        "withdrawal_rejected": "❌ 출금 거절 - 사유: {reason}",
        "new_referral": "👤 새로운 추천 회원 {username}이 가입했습니다",
    }

    async def send_system_message(user_id, template_key, **kwargs)
    async def send_bulk_message(user_ids, title, content)
    async def send_to_all(title, content, filters=None)
```

**연동 포인트:**
- RewardEngine → 지급/거절 시 호출
- finance.py → 입출금 승인/거절 시 호출
- users.py → 상태 변경/강제 로그아웃 시 호출

**검증 체크리스트:**
- [ ] 포인트 지급 → 자동 쪽지 생성
- [ ] 입금 승인 → 자동 쪽지 생성
- [ ] 출금 거절 → 거절 사유 포함 쪽지
- [ ] 회원 정지 → 상태 변경 쪽지

### Task 3-2: 대량 쪽지 발송 API

**백엔드 추가:**
```
POST /messages/bulk
  body: {
    title, content,
    target: "all" | "by_status" | "by_rank" | "by_ids",
    target_value: "active" | "agency" | [1, 2, 3],
  }
```

**로직:**
1. target에 따라 대상 회원 ID 목록 조회
2. 배치 삽입 (1000건씩 chunked insert)
3. 발송 결과 반환 (성공/실패 카운트)

**프론트엔드:**
- 사이드바 > 쪽지관리 메뉴 추가
- 대량 발송 폼: 대상 선택 + 제목 + 내용 (에디터)
- 발송 이력 목록

**검증 체크리스트:**
- [ ] 전체 발송 → 모든 회원에게 Message 생성
- [ ] 등급별 발송 → 해당 등급만
- [ ] 상태별 발송 → 해당 상태만
- [ ] ID 지정 발송 → 지정 회원만

---

## Phase 4: 회수/취소 (MEDIUM)

> **목표**: "지급이 있으면 회수가 있다" 양방향 원칙 완성
> **검증**: 지급 → 회수 → 잔액/포인트 정확히 원복

### Task 4-1: 프로모션 보너스 회수

**백엔드 추가:**
```
POST /promotions/{promotion_id}/participants/{claim_id}/revoke
  body: { reason }
```

**로직:**
1. UserPromotion status → "revoked"
2. user.balance -= bonus_amount (or user.points)
3. MoneyLog/PointLog 기록 (type="promotion_revoke")
4. 쪽지: "프로모션 보너스가 회수되었습니다. 사유: {reason}"

**검증 체크리스트:**
- [ ] 보너스 회수 → user.balance 감소
- [ ] 이미 회수된 건 재회수 → 에러
- [ ] 쪽지 발송 확인
- [ ] MoneyLog 기록 확인

### Task 4-2: 쿠폰 사용 취소

**백엔드 추가:**
```
POST /promotions/coupons/{coupon_id}/users/{user_id}/cancel
```

**로직:**
1. UserCoupon 삭제
2. UserPromotion status → "cancelled"
3. user.balance -= bonus_amount
4. coupon.used_count -= 1
5. 쪽지: "쿠폰 사용이 취소되었습니다"

**검증 체크리스트:**
- [ ] 쿠폰 취소 → 보너스 회수 + used_count 감소
- [ ] 취소 후 같은 쿠폰 재사용 가능
- [ ] 미사용 쿠폰 취소 → 에러

### Task 4-3: 커미션 정정/환수

**백엔드 추가:**
```
POST /commissions/ledger/{ledger_id}/reverse
  body: { reason }
```

**로직:**
1. 원본 CommissionLedger에 대한 역분개(reversal) 레코드 생성
2. user.balance -= commission_amount (pending_balance에서 차감)
3. MoneyLog 기록 (type="commission_reversal")
4. 쪽지: "커미션이 정정되었습니다. 사유: {reason}"

**검증 체크리스트:**
- [ ] 커미션 환수 → 역분개 레코드 생성
- [ ] user.balance 정확히 차감
- [ ] 이미 환수된 건 재환수 → 에러

---

## Phase 5: 자동 승인 룰 + 메모 이력 (MEDIUM)

> **목표**: 운영 효율화 기능
> **검증**: 룰 설정 → 입출금 자동 승인 동작, 메모 이력 추적

### Task 5-1: 입출금 자동 승인 룰 엔진

**신규 테이블:** `auto_approve_rules`
```
id, type (deposit/withdrawal), condition_type, condition_value,
max_amount, is_active, created_by, created_at
```

**condition_type 종류:**
- `amount_under`: 금액 이하 자동 승인
- `user_level_above`: 회원 레벨 이상 자동 승인
- `user_rank_in`: 특정 등급 자동 승인

**백엔드 변경:**
- `create_deposit` / `create_withdrawal` 수정
- 입출금 생성 시 룰 체크 → 매칭되면 즉시 `approve_transaction` 호출

**API:**
```
GET    /finance/auto-approve-rules
POST   /finance/auto-approve-rules
PUT    /finance/auto-approve-rules/{id}
DELETE /finance/auto-approve-rules/{id}
POST   /finance/auto-approve-rules/{id}/toggle
```

**프론트엔드:**
- 재무관리 > 자동 승인 설정 서브메뉴
- 룰 CRUD + 활성/비활성 토글

**검증 체크리스트:**
- [ ] 룰 설정 후 조건 매칭 입금 → 자동 승인
- [ ] 룰 비활성화 시 수동 승인 필요
- [ ] 복수 룰 중 1개만 매칭되어도 자동 승인
- [ ] 자동 승인 시에도 텔레그램 알림 발송

### Task 5-2: 회원 메모 이력 관리

**신규 테이블:** `user_memos`
```
id, user_id, content, admin_user_id, created_at
```

**백엔드 API:**
```
GET    /users/{id}/memos              → 메모 이력 목록
POST   /users/{id}/memos              → 메모 추가
DELETE /users/{id}/memos/{memo_id}    → 메모 삭제
```

**기존 변경:**
- User.memo (단일 필드) → user_memos 테이블로 이관
- 최신 메모가 User.memo에도 동기화 (하위 호환)

**프론트엔드:**
- 회원 상세 > 기본정보 탭의 메모란 → 이력 리스트로 변경
- [메모 추가] 버튼 + 작성자/시간 표시
- 이전 메모 접기/펼치기

**검증 체크리스트:**
- [ ] 메모 추가 → user_memos + User.memo 동기화
- [ ] 메모 이력 조회 → 시간순 정렬, 작성자 표시
- [ ] 메모 삭제 → 실제 삭제 (최신 메모 갱신)

---

## 3. 시니어 개발자 추가 제안 기능

감사 과정에서 발견한 추가 개선 사항:

### 제안 1: 보상 대시보드
- 오늘/이번주 자동 지급된 보상 총액 대시보드
- pending 보상 건수 알림 배지 (사이드바)
- 보상 유형별 통계 차트

### 제안 2: 운영 감사 로그 강화
- 현재 AuditLog가 기본적인 수준
- 모든 양방향 작업에 "누가, 언제, 무엇을, 왜" 기록
- 감사 로그 검색/필터링 UI

### 제안 3: 프로모션 워거링(배팅 조건) 자동 추적
- 현재 `wagering_required`/`wagering_completed` 필드만 있고 추적 안 함
- 베팅 시 자동으로 `wagering_completed` 증가
- 조건 충족 시 보너스 출금 가능으로 전환

> 이 3개 제안은 Phase 5 이후 별도 Phase로 진행 가능

---

## 4. 기술 규격

### 신규 테이블 (6개)
| 테이블 | Phase | 설명 |
|--------|-------|------|
| `pending_rewards` | 2 | 승인 대기 보상 |
| `user_attendance_logs` | 2 | 출석 체크 기록 |
| `user_missions` | 2 | 미션 진행/완료 기록 |
| `user_spin_logs` | 2 | 스핀 기록 |
| `auto_approve_rules` | 5 | 자동 승인 룰 |
| `user_memos` | 5 | 메모 이력 |

### 신규 서비스 (2개)
| 서비스 | Phase | 설명 |
|--------|-------|------|
| `reward_engine.py` | 2 | 보상 지급 엔진 |
| `message_service.py` | 3 | 쪽지 발송 서비스 |

### 신규 API (약 25개)
| Phase | 신규 엔드포인트 수 |
|-------|-------------------|
| Phase 1 | 5개 (activate, ban, point-adjust, force-logout, 회원생성 수정) |
| Phase 2 | 8개 (reward pending CRUD, check-in, mission complete/claim, spin, payback, promo 수정) |
| Phase 3 | 3개 (message service + bulk send + 각 모듈 연동은 서비스 레벨) |
| Phase 4 | 3개 (promo revoke, coupon cancel, commission reverse) |
| Phase 5 | 6개 (auto-approve CRUD+toggle, memo CRUD) |

### 수정 파일 (기존)
| 파일 | 변경 내용 |
|------|-----------|
| `users.py` | create_user 수정 + activate/ban/force-logout 추가 |
| `finance.py` | point-adjustment + 자동 승인 연동 |
| `promotions.py` | claim 시 실제 잔액 반영 + revoke |
| `commissions.py` | reverse 추가 |
| `auth.py` 또는 `deps.py` | force_logout_at 토큰 검증 |
| User 모델 | `force_logout_at` 컬럼 추가 |

---

## 5. 작업 지침 (중단 대비)

### 단계별 완료 체크 프로토콜

> **모든 Task 완료 시 반드시:**

1. ✅ 검증 체크리스트 **모든 항목** 통과
2. ✅ 이 문서의 해당 Task ❌ → ✅ 변경
3. ✅ `git add` + `git commit` (Task 단위 커밋)
4. ✅ CLAUDE.md 진행 상황 업데이트
5. ✅ 프론트엔드 빌드 확인 (`npx next build --webpack`)

### Phase 완료 시 추가 프로토콜

1. ✅ 전체 백엔드 서버 재시작 후 동작 확인
2. ✅ 해당 Phase의 모든 API swagger 확인
3. ✅ Phase 완료 커밋 + 태그
4. ✅ CLAUDE.md에 Phase 완료 기록

### 중단 복구 가이드

- 각 Task는 **독립적으로 커밋** → 중단 시 마지막 커밋 지점부터 재개
- 이 계획서의 체크리스트로 현재 위치 파악
- `git log --oneline -5`로 마지막 작업 확인

---

## 6. 진행 상태 트래커

| Phase | Task | 상태 | 커밋 |
|-------|------|------|------|
| 1 | 1-1: 회원가입 추천코드 필수 | ✅ | Phase 1 커밋 |
| 1 | 1-2: 활성화/정지/차단 API 쌍 | ✅ | Phase 1 커밋 |
| 1 | 1-3: 포인트 단건 지급/차감 | ✅ | Phase 1 커밋 |
| 1 | 1-4: 강제 로그아웃 | ✅ | Phase 1 커밋 |
| 2 | 2-1: RewardEngine 공통 서비스 | ✅ | Phase 2 커밋 |
| 2 | 2-2: 출석 체크 지급 연동 | ✅ | Phase 2 커밋 |
| 2 | 2-3: 미션 완료 지급 연동 | ✅ | Phase 2 커밋 |
| 2 | 2-4: 스핀 보상 지급 연동 | ✅ | Phase 2 커밋 |
| 2 | 2-5: 페이백 자동 계산/지급 | ✅ | Phase 2 커밋 |
| 2 | 2-6: 프로모션 claim 실제 반영 | ✅ | Phase 2 커밋 |
| 3 | 3-1: 자동 쪽지 알림 서비스 | ✅ | Phase 3 커밋 |
| 3 | 3-2: 대량 쪽지 발송 | ✅ | Phase 3 커밋 |
| 4 | 4-1: 프로모션 보너스 회수 | ✅ | Phase 4 커밋 |
| 4 | 4-2: 쿠폰 사용 취소 | ✅ | Phase 4 커밋 |
| 4 | 4-3: 커미션 정정/환수 | ✅ | Phase 4 커밋 |
| 5 | 5-1: 자동 승인 룰 엔진 | ✅ | Phase 5 커밋 |
| 5 | 5-2: 메모 이력 관리 | ✅ | Phase 5 커밋 |
