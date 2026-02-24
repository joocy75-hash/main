# RapidAPI 외부 게임/스포츠 API 통합 구현 계획서

> **작성일**: 2026-02-24
> **작성자**: Opus 4.6 Agent Team
> **우선순위**: P0 (유저 사이트 핵심 기능)
> **API 문서**: `API-REFERENCE.md`
> **예상 Phase**: 6 Phase (Phase 0~5)
> **참조**: 기존 BaseConnector 어댑터 패턴 활용

---

## 0. 현황 분석

### 0-1. API-REFERENCE.md 요약

| # | API | 호스트 | 상태 | 무료 쿼터 | 용도 |
|---|-----|--------|------|-----------|------|
| 1 | **Odds Feed** | odds-feed.p.rapidapi.com | ✅ Working | 500/월 | 스포츠 배당률 (7개 북메이커) |
| 2 | **SportAPI7** | sportapi7.p.rapidapi.com | ✅ Working | 50/월 | 실시간 스포츠 데이터 (20+ 종목) |
| 3 | **Casino & Slots** | live-casino-slots-...p.rapidapi.com | ✅ Working | 299/월 | 카지노/슬롯 게임 (100+ 프로바이더) |
| 4 | All Sport Live Stream | all-sport-live-stream... | ⚠️ Partial | 99/월 | 스포츠 스트리밍 (일부 깨짐) |
| 5~8 | Dead APIs (4개) | - | ❌ Dead | - | 사용 불가 |

### 0-2. 기존 아키텍처 (재활용)

```
BaseConnector (추상 기본)
├── CasinoConnector   → RapidAPI Casino & Slots로 전환
├── SlotConnector     → RapidAPI Casino & Slots로 전환 (슬롯 프로바이더)
├── SportsConnector   → RapidAPI Odds Feed + SportAPI7로 전환
└── HoldemConnector   → 유지 (RapidAPI에 홀덤 전용 없음)
```

### 0-3. 핵심 설계 결정

| 결정 | 내용 | 이유 |
|------|------|------|
| **프록시 구조** | Admin Backend → RapidAPI → 유저사이트 | API Key 보호, 쿼터 관리 |
| **캐싱 전략** | Redis 적극 활용 (TTL: 30s~24h) | 무료 쿼터 절약 (849회/월) |
| **쿼터 관리** | Redis 카운터 + 관리자 대시보드 | 초과 방지, 비용 통제 |
| **연동 범위** | Casino > Sports > Stream 순서 | 비즈니스 가치 + 쿼터 효율 |
| **Dead API** | 완전 제외 | 4개 모두 비활성 확인됨 |

---

## 1. Phase 구조 (6 Phase, 총 24 Task)

```
Phase 0: 기반 인프라 (RapidAPI 프록시 + 캐싱 + 쿼터 관리)     ← 최우선
Phase 1: 카지노 & 슬롯 API 통합 (100+ 프로바이더)              ← P0 핵심
Phase 2: 스포츠 배당 API 통합 (Odds Feed)                     ← P1 핵심
Phase 3: 실시간 스포츠 데이터 (SportAPI7)                      ← P1 보조
Phase 4: 관리자 대시보드 + 모니터링 UI                         ← P2 운영
Phase 5: 유저사이트 연동 + E2E 검증                            ← P2 통합
```

---

## Phase 0: 기반 인프라 (CRITICAL)

> **목표**: RapidAPI 공통 클라이언트 + Redis 캐싱 + 쿼터 추적 시스템 구축
> **검증**: API 호출 → 캐시 적중 → 쿼터 카운팅 전체 플로우 동작 확인
> **예상**: Task 4개

### Task 0-1: RapidAPI 공통 클라이언트 서비스

**신규 파일**: `backend/app/services/rapidapi_client.py`

```python
class RapidAPIClient:
    """모든 RapidAPI 호출의 단일 진입점"""

    API_KEY = "..."  # 환경변수에서 로드
    MAX_RETRIES = 3
    TIMEOUT = 30

    async def get(self, host: str, path: str, params: dict = None) -> dict:
        # 1. 쿼터 체크 (초과 시 예외)
        # 2. Redis 캐시 확인
        # 3. 캐시 미스 시 실제 API 호출
        # 4. 쿼터 카운터 증가
        # 5. 캐시 저장
        # 6. 응답 반환

    async def post(self, host: str, path: str, body: dict) -> dict:
        # POST 요청 (게임 런칭 등 캐싱 불가 요청)

    async def get_quota_status(self, api_name: str) -> dict:
        # 현재 쿼터 사용량 반환
```

**환경변수 추가** (`.env`):
```
RAPIDAPI_KEY=17f6229311msh4d59759f1dcb20cp14a69djsnc2220d97ece0
RAPIDAPI_ODDS_QUOTA=500
RAPIDAPI_SPORT_QUOTA=50
RAPIDAPI_CASINO_QUOTA=299
RAPIDAPI_STREAM_QUOTA=99
```

**검증 체크리스트:**
- [ ] 환경변수 로드 성공
- [ ] API 호출 → 정상 응답
- [ ] 재시도 로직 (3회) 동작
- [ ] 타임아웃 처리

---

### Task 0-2: Redis 캐싱 레이어 (쿼터 절약 핵심)

**기존 cache_service.py 확장**:

```python
# 캐시 TTL 전략 (쿼터 절약)
CACHE_TTL = {
    "providers_list": 86400,    # 24시간 (거의 불변)
    "games_by_provider": 3600,  # 1시간 (가끔 변동)
    "live_events": 30,          # 30초 (실시간)
    "event_odds": 15,           # 15초 (배당률 변동)
    "sport_events": 30,         # 30초 (실시간)
}
```

**캐시 키 구조**:
```
rapidapi:casino:providers                          → 24h
rapidapi:casino:games:{provider}                   → 1h
rapidapi:odds:events:{status}                      → 30s
rapidapi:odds:markets:{event_id}                   → 15s
rapidapi:sport:{sport}:live                        → 30s
rapidapi:quota:{api_name}:{yyyy-mm}                → 월별 카운터
```

**검증 체크리스트:**
- [ ] 캐시 적중 시 API 호출 안 함
- [ ] TTL 만료 후 자동 갱신
- [ ] 캐시 키 패턴 삭제 동작
- [ ] 쿼터 카운터 증가/조회

---

### Task 0-3: 쿼터 관리 서비스

**신규 파일**: `backend/app/services/quota_service.py`

```python
class QuotaService:
    """API별 월간 쿼터 추적 + 경고"""

    QUOTAS = {
        "odds_feed": 500,
        "sport_api7": 50,
        "casino_api": 299,
        "stream_api": 99,
    }

    async def check_quota(self, api_name: str) -> bool:
        # 쿼터 잔량 확인 → True/False

    async def increment(self, api_name: str) -> int:
        # 사용량 +1, 현재 사용량 반환

    async def get_all_quotas(self) -> list[dict]:
        # 전체 API 쿼터 현황 반환

    async def should_warn(self, api_name: str) -> bool:
        # 80% 이상 사용 시 True → 텔레그램 경고
```

**관리자 API**:
```
GET /api/v1/external-api/quotas  → 전체 쿼터 현황
POST /api/v1/external-api/quotas/reset/{api_name}  → 쿼터 수동 리셋
```

**검증 체크리스트:**
- [ ] 쿼터 100% 도달 시 API 호출 차단
- [ ] 80% 경고 알림 발송
- [ ] 월초 자동 리셋
- [ ] 관리자 수동 리셋

---

### Task 0-4: RapidAPI 커넥터 어댑터 (BaseConnector 확장)

**신규 파일**: `backend/app/connectors/rapidapi_casino_connector.py`
**신규 파일**: `backend/app/connectors/rapidapi_sports_connector.py`

```python
class RapidAPICasinoConnector(BaseConnector):
    """RapidAPI Casino & Slots → BaseConnector 어댑터"""
    HOST = "live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com"

    async def authenticate(self) -> dict:
        return await self.client.get(self.HOST, "/getallproviders")

    async def get_games(self) -> list[dict]:
        data = await self.client.get(self.HOST, f"/getallgamesandprovider?provider={self.provider_code}")
        return [self._normalize(g) for g in data.get("games", [])]

    async def launch_game(self, user_id, game_id, **kwargs) -> dict:
        return await self.client.post(self.HOST, "/getgameurl", {
            "username": user_id,
            "gameId": game_id,
            "lang": "ko",
            "money": 0,
            "home_url": kwargs.get("home_url", ""),
            "platform": kwargs.get("platform", 1),
            "currency": "KRW"
        })


class RapidAPISportsConnector(BaseConnector):
    """RapidAPI Odds Feed + SportAPI7 → BaseConnector 어댑터"""

    async def get_live_events(self, status="LIVE") -> list[dict]:
        ...

    async def get_event_odds(self, event_id: int) -> list[dict]:
        ...

    async def get_sport_live(self, sport: str) -> list[dict]:
        ...
```

**커넥터 팩토리 업데이트** (`__init__.py`):
```python
CONNECTOR_MAP = {
    "casino": RapidAPICasinoConnector,  # 변경
    "slot": RapidAPICasinoConnector,    # 변경 (슬롯도 동일 API)
    "sports": RapidAPISportsConnector,  # 변경
    "esports": RapidAPISportsConnector, # 변경
    "holdem": HoldemConnector,          # 유지
    "mini_game": RapidAPICasinoConnector, # 변경
    "virtual_soccer": RapidAPISportsConnector, # 변경
}
```

**검증 체크리스트:**
- [ ] 기존 BaseConnector 인터페이스 100% 호환
- [ ] 기존 커넥터 테스트/동기화 기능 유지
- [ ] 새 커넥터로 게임 동기화 성공
- [ ] 프론트엔드 게임 관리 페이지 정상 동작

---

## Phase 1: 카지노 & 슬롯 API 통합 (P0)

> **목표**: RapidAPI Casino API로 100+ 프로바이더 게임 카탈로그 구축 + 게임 런칭
> **쿼터 전략**: 프로바이더 목록(1회/24h) + 게임 목록(프로바이더별 1회/1h) → 월 ~50회 소모
> **검증**: 프로바이더 동기화 → 게임 목록 → 게임 런칭 URL 생성 전체 플로우

### Task 1-1: 프로바이더 자동 동기화

**백엔드 추가**:
```
POST /api/v1/external-api/casino/sync-providers
```

**로직**:
1. RapidAPI `/getallproviders` 호출 (캐시: 24시간)
2. 반환된 프로바이더 목록 (100+개) 파싱
3. 카테고리 자동 분류:
   - `*LIVE` → casino
   - `*SLOTS` → slot
   - `*SPORTS` → sports
   - `SPRIBE` 등 → mini_game
4. DB GameProvider 테이블에 upsert
5. 결과 반환: new_count, updated_count, total_count

**카테고리 매핑 테이블**:
```python
PROVIDER_CATEGORY_MAP = {
    # Live Casino
    "EVOLUTIONLIVE": "casino",
    "PRAGMATICLIVE": "casino",
    "EZUGI": "casino",
    "SAGAMING": "casino",
    "PLAYTECHLIVE": "casino",
    "DREAMGAMING": "casino",
    "WMCASINO": "casino",
    "SEXYGAMING": "casino",
    # Slots
    "PRAGMATICSLOTS": "slot",
    "PGSOFT": "slot",
    "JILIGAMING": "slot",
    "JDB": "slot",
    "CQ9": "slot",
    "HABANERO": "slot",
    "SPADEGAMING": "slot",
    "MICROGAMING": "slot",
    "NETENT": "slot",
    "HACKSAW": "slot",
    "REDTIGER": "slot",
    "PLAYTECHSLOTS": "slot",
    # Sports
    "BTISPORTS": "sports",
    "SABASPORTS": "sports",
    "DPSPORTS": "sports",
    "CMDSPORTS": "sports",
    # Mini Games
    "SPRIBE": "mini_game",
    "SMARTSOFT": "mini_game",
}
# 미분류 → 기본값 "slot"
```

**검증 체크리스트:**
- [ ] `/getallproviders` API 호출 성공
- [ ] 100+ 프로바이더 DB 저장
- [ ] 카테고리 자동 분류 정확성
- [ ] 캐시 적중 시 API 재호출 안 함
- [ ] 관리자 UI에서 프로바이더 목록 확인

---

### Task 1-2: 게임 카탈로그 동기화

**백엔드 추가**:
```
POST /api/v1/external-api/casino/sync-games/{provider_code}
POST /api/v1/external-api/casino/sync-all-games  (전체 일괄)
```

**로직** (개별):
1. `/getallgamesandprovider?provider={code}` 호출 (캐시: 1시간)
2. 게임 배열 파싱 (name, id, img, provider)
3. DB Game 테이블에 upsert
4. 썸네일 URL 저장

**일괄 동기화**:
1. 활성 프로바이더 목록 조회
2. 비동기 병렬 동기화 (5개씩 배치)
3. 진행 상황 SSE 또는 폴링
4. 총 소요 쿼터 = 프로바이더 수 (캐시 미적중 시)

**쿼터 절약 전략**:
- 일괄 동기화는 일 1회 제한
- 캐시 적중 시 쿼터 소모 없음
- 관리자가 수동 트리거만 가능

**검증 체크리스트:**
- [ ] 프로바이더별 게임 목록 조회 성공
- [ ] Evolution: 420+개 게임 동기화
- [ ] 썸네일 URL 정상 저장
- [ ] 중복 게임 코드 처리 (upsert)
- [ ] 일괄 동기화 시 쿼터 소모량 확인

---

### Task 1-3: 게임 런칭 URL 생성 API

**백엔드 추가**:
```
POST /api/v1/external-api/casino/launch
  body: {
    user_id: int,
    game_id: str,        # RapidAPI game ID
    platform: int,       # 1=desktop, 2=mobile
    currency: "KRW",
    home_url: str        # 게임 종료 시 복귀 URL
  }
```

**로직**:
1. 유저 존재 여부 확인
2. 게임 존재 + 활성 여부 확인
3. RapidAPI `/getgameurl` POST 호출 (**캐싱 불가** - 매번 쿼터 소모)
4. 런칭 URL 반환 (60초 만료)
5. GameRound 레코드 생성 (베팅 추적용)
6. 런칭 로그 기록

**보안**:
- 게임 런칭은 **인증된 관리자만** 가능 (유저사이트에서는 별도 프록시 필요)
- Rate Limit: 유저당 분당 5회

**검증 체크리스트:**
- [ ] 게임 런칭 URL 생성 성공
- [ ] URL 60초 내 유효
- [ ] 존재하지 않는 게임 → 404
- [ ] 비활성 게임 → 403
- [ ] Rate Limit 초과 → 429

---

### Task 1-4: 프로바이더/게임 관리 UI 강화

**프론트엔드 변경**:

1. **프로바이더 목록 페이지** 강화:
   - [RapidAPI 동기화] 버튼 추가
   - 마지막 동기화 시간 표시
   - 게임 수 배지 표시

2. **프로바이더 상세** 강화:
   - [게임 동기화] 버튼 (개별)
   - 동기화 진행 프로그레스바
   - API 연결 상태 표시 (연결됨/미연결)

3. **게임 목록** 강화:
   - 썸네일 이미지 미리보기
   - [게임 런칭 테스트] 버튼 (새 탭)
   - 프로바이더별 게임 수 통계

**검증 체크리스트:**
- [ ] 동기화 버튼 클릭 → 프로바이더 동기화 성공
- [ ] 게임 동기화 → 게임 목록 갱신
- [ ] 썸네일 이미지 표시
- [ ] 게임 런칭 테스트 동작

---

## Phase 2: 스포츠 배당 API 통합 (P1)

> **목표**: Odds Feed API로 실시간 스포츠 이벤트 + 멀티 북메이커 배당률 제공
> **쿼터 전략**: 30초 캐싱 → 월 ~43,200회 필요 → **Pro 플랜 ($5/월) 필수**
> **검증**: 라이브 이벤트 조회 → 배당률 표시 → 관리자 모니터링

### Task 2-1: 스포츠 이벤트 프록시 API

**백엔드 추가**:
```
GET /api/v1/external-api/sports/events?status=LIVE
GET /api/v1/external-api/sports/events?status=SCHEDULED
```

**로직**:
1. Odds Feed `/api/v1/events?status={status}` 호출 (캐시: 30초)
2. 응답 정규화 (한국어 종목명 매핑)
3. 데이터 변환:
   - sport.name → 한국어 (Football→축구, Tennis→테니스 등)
   - 배당률 포맷팅 (소수점 2자리)
   - 상태 번역 (2nd Half→후반전 등)

**종목명 매핑**:
```python
SPORT_NAME_KO = {
    "Football": "축구",
    "Tennis": "테니스",
    "Basketball": "농구",
    "Baseball": "야구",
    "Ice Hockey": "아이스하키",
    "Esports": "e스포츠",
    "MMA": "격투기",
    "Volleyball": "배구",
    "Table Tennis": "탁구",
    "Handball": "핸드볼",
}
```

**검증 체크리스트:**
- [ ] LIVE 이벤트 조회 성공
- [ ] SCHEDULED 이벤트 조회 성공
- [ ] 한국어 종목명 매핑 정확
- [ ] 배당률 데이터 정상 (outcome_0/1/2)
- [ ] 30초 캐싱 동작 확인

---

### Task 2-2: 멀티 북메이커 배당률 API

**백엔드 추가**:
```
GET /api/v1/external-api/sports/odds/{event_id}
```

**로직**:
1. Odds Feed `/api/v1/markets/feed?event_ids={id}` 호출 (캐시: 15초)
2. 북메이커별 배당률 정리
3. 마켓 유형별 그룹핑 (1X2, Over/Under, BTTS 등)
4. 최고/최저 배당률 하이라이트

**북메이커 한국어명**:
```python
BOOKMAKER_NAME_KO = {
    "BETFAIR_EXCHANGE": "베트페어",
    "1XBET": "원엑스벳",
    "STAKE": "스테이크",
    "BWIN": "비윈",
    "UNIBET": "유니벳",
    "BET365": "벳365",
    "PINNACLE": "피나클",
}
```

**검증 체크리스트:**
- [ ] 이벤트별 배당률 조회 성공
- [ ] 7개 북메이커 데이터 정상
- [ ] 1X2, Over/Under 마켓 포함
- [ ] 15초 캐싱 동작

---

### Task 2-3: 스포츠 모니터링 UI (관리자)

**프론트엔드 신규 페이지**: `/dashboard/sports-monitor/page.tsx`

**레이아웃**:
```
┌─────────────────────────────────────────────┐
│ [라이브] [예정] [종료]    종목: [전체 ▾]    │
├─────────────────────────────────────────────┤
│ 🔴 LIVE  맨유 vs 리버풀      2:1  67'       │
│          1.85  3.50  4.20  (Odds Feed)      │
├─────────────────────────────────────────────┤
│ 🔴 LIVE  레알 vs 바르사      0:0  23'       │
│          2.10  3.20  3.40  (Odds Feed)      │
├─────────────────────────────────────────────┤
│ 📊 이벤트 클릭 → 상세 배당률 패널           │
│    북메이커별: 벳365 1.85 | 피나클 1.90     │
│    마켓: 1X2 | O/U 2.5 | BTTS              │
└─────────────────────────────────────────────┘
```

**자동 갱신**: 30초 인터벌 (useInterval)

**검증 체크리스트:**
- [ ] 라이브 이벤트 실시간 표시
- [ ] 30초 자동 갱신
- [ ] 이벤트 클릭 → 상세 배당률
- [ ] 종목 필터링 동작
- [ ] 빈 이벤트 안내 문구

---

## Phase 3: 실시간 스포츠 데이터 (P1)

> **목표**: SportAPI7로 풍부한 팀 데이터 + e스포츠 지원
> **쿼터 주의**: 50회/월만 무료 → 캐싱 극대화 + Pro($15/월) 고려
> **검증**: 멀티스포츠 라이브 + e스포츠 데이터 정상 표시

### Task 3-1: 멀티스포츠 라이브 데이터 API

**백엔드 추가**:
```
GET /api/v1/external-api/sports/live/{sport}
  sport: football, tennis, basketball, esports, hockey, baseball 등
```

**로직**:
1. SportAPI7 `/api/v1/sport/{sport}/events/live` 호출 (캐시: 30초)
2. 풍부한 팀 데이터 정규화 (nameCode, logo 등)
3. 점수 세부 정보 (period1, period2)
4. 토너먼트/리그 정보 포함

**검증 체크리스트:**
- [ ] 축구 라이브 이벤트 조회
- [ ] e스포츠 라이브 조회 (CS2, LoL, Dota2)
- [ ] 점수 세부 정보 (세트/맵별)
- [ ] 30초 캐싱 동작

---

### Task 3-2: e스포츠 전용 데이터 가공

**백엔드 추가**:
```
GET /api/v1/external-api/esports/live
GET /api/v1/external-api/esports/categories
```

**e스포츠 카테고리**:
```python
ESPORTS_CATEGORIES = {
    "Counter-Strike": {"name": "CS2", "icon": "🔫"},
    "League of Legends": {"name": "LoL", "icon": "⚔️"},
    "Dota 2": {"name": "도타2", "icon": "🛡️"},
    "Valorant": {"name": "발로란트", "icon": "🎯"},
}
```

**특수 필드 처리**:
- `bestOf`: 시리즈 형식 (Bo3, Bo5)
- 맵별 스코어 파싱
- 팀 로스터 정보 (가능 시)

**검증 체크리스트:**
- [ ] CS2 라이브 매치 표시
- [ ] LoL 라이브 매치 표시
- [ ] Bo3/Bo5 형식 표시
- [ ] 카테고리 필터링

---

### Task 3-3: Odds + SportAPI7 통합 뷰

**통합 서비스**: `backend/app/services/sports_aggregator.py`

```python
class SportsAggregator:
    """Odds Feed + SportAPI7 데이터 통합"""

    async def get_enriched_events(self, sport: str) -> list[dict]:
        # 1. SportAPI7에서 풍부한 이벤트 데이터 가져오기
        # 2. Odds Feed에서 배당률 데이터 가져오기
        # 3. 이벤트 ID/팀명으로 매칭
        # 4. 통합 응답 반환
```

**검증 체크리스트:**
- [ ] 두 API 데이터 매칭 성공
- [ ] 매칭 실패 시 부분 데이터 반환
- [ ] 쿼터 효율 (2 API 동시 호출)

---

## Phase 4: 관리자 대시보드 + 모니터링 (P2)

> **목표**: 외부 API 상태/쿼터/비용 실시간 모니터링
> **검증**: 대시보드에서 전체 API 현황 한눈에 확인

### Task 4-1: 외부 API 모니터링 대시보드

**프론트엔드 신규 페이지**: `/dashboard/external-api/page.tsx`

**레이아웃**:
```
┌─ API 상태 요약 ──────────────────────────────┐
│ 🟢 Odds Feed    │ 🟢 SportAPI7  │ 🟢 Casino │
│ 245/500 (49%)   │ 12/50 (24%)   │ 89/299    │
│ 잔여: 255회     │ 잔여: 38회    │ 잔여: 210 │
├─ 쿼터 사용량 차트 ───────────────────────────┤
│ [일별 사용량 라인 차트]                       │
├─ 최근 API 호출 로그 ─────────────────────────┤
│ 10:30:25  Odds Feed  /events   200  45ms     │
│ 10:30:20  Casino     /games    200  123ms    │
│ 10:29:55  SportAPI7  /live     200  89ms     │
├─ 비용 예측 ──────────────────────────────────┤
│ 현재: $0/월 (무료 플랜)                       │
│ 예측: Pro 전환 시 $20/월 (Odds $5+Sport $15) │
└──────────────────────────────────────────────┘
```

**검증 체크리스트:**
- [ ] API 상태 실시간 표시
- [ ] 쿼터 % 정확
- [ ] 80% 초과 시 빨간색 경고
- [ ] 100% 도달 시 차단 표시

---

### Task 4-2: API 호출 로그 시스템

**신규 테이블**: `external_api_logs`
```sql
CREATE TABLE external_api_logs (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50),      -- odds_feed, sport_api7, casino_api
    endpoint VARCHAR(200),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    cached BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**백엔드 API**:
```
GET /api/v1/external-api/logs?api_name=&limit=50
GET /api/v1/external-api/stats  → 일별/주별 집계
```

**검증 체크리스트:**
- [ ] 모든 API 호출 자동 로깅
- [ ] 캐시 적중도 로깅 (cached=true)
- [ ] 에러 메시지 기록
- [ ] 집계 쿼리 정확

---

### Task 4-3: 알림 + 자동 차단 시스템

**알림 조건**:
1. 쿼터 80% 도달 → 텔레그램 경고
2. 쿼터 95% 도달 → 텔레그램 + 관리자 쪽지
3. 쿼터 100% → 자동 차단 + 긴급 알림
4. API 응답 에러 5회 연속 → 경고
5. 응답 시간 5초 초과 → 경고

**검증 체크리스트:**
- [ ] 80% 경고 텔레그램 발송
- [ ] 100% 차단 + 알림
- [ ] 연속 에러 감지
- [ ] 응답 지연 감지

---

## Phase 5: 유저사이트 연동 + E2E 검증 (P2)

> **목표**: casino 유저사이트에서 실제 게임 플레이 + 스포츠 배팅 연동
> **검증**: 유저 로그인 → 게임 선택 → 런칭 → 플레이 전체 플로우

### Task 5-1: 유저사이트 게임 프록시 API

**관리자 백엔드에 추가**:
```
# 유저사이트 전용 (별도 인증)
GET  /api/v1/user-proxy/casino/providers
GET  /api/v1/user-proxy/casino/games/{provider}
POST /api/v1/user-proxy/casino/launch
GET  /api/v1/user-proxy/sports/live
GET  /api/v1/user-proxy/sports/odds/{event_id}
```

**인증**: 유저사이트 → 관리자 백엔드 간 **서비스 토큰** (API Key)

**검증 체크리스트:**
- [ ] 유저사이트에서 프로바이더 목록 조회
- [ ] 게임 목록 + 썸네일 표시
- [ ] 게임 런칭 URL 생성 + 열기
- [ ] 스포츠 라이브 데이터 표시

---

### Task 5-2: 유저사이트 프론트엔드 연동

**casino 프로젝트 수정**:
- `frontend/src/lib/api.ts` → 관리자 백엔드 프록시 엔드포인트 연결
- 게임 로비 → RapidAPI 프로바이더 데이터 사용
- 스포츠 페이지 → 실시간 이벤트 + 배당률

**검증 체크리스트:**
- [ ] 게임 로비에 100+ 프로바이더 게임 표시
- [ ] 게임 클릭 → iframe/새탭 런칭
- [ ] 스포츠 페이지 실시간 데이터
- [ ] 모바일 반응형 동작

---

### Task 5-3: E2E 통합 검증

**전체 플로우 테스트**:
1. 관리자: 프로바이더 동기화 실행
2. 관리자: 게임 카탈로그 동기화
3. 관리자: 스포츠 모니터링 확인
4. 유저사이트: 게임 로비 진입
5. 유저사이트: 게임 선택 + 런칭
6. 유저사이트: 스포츠 라이브 확인
7. 관리자: 쿼터 사용량 확인
8. 관리자: API 로그 확인

**검증 체크리스트:**
- [ ] 전체 8단계 플로우 성공
- [ ] 쿼터 카운팅 정확
- [ ] 에러 없이 동작
- [ ] 응답 시간 2초 이내

---

## 2. 추가 제안 기능 (Opus 4.6 의견)

### 제안 1: 🔄 스마트 캐시 프리워밍 (쿼터 최적화)

> **문제**: 무료 쿼터가 매우 적음 (총 849회/월)
> **해결**: 크론 기반 스마트 프리워밍

```python
# 매일 새벽 4시 자동 실행
async def prewarm_cache():
    # 프로바이더 목록 (1회/일)
    await rapidapi.get("casino", "/getallproviders")

    # 인기 프로바이더 게임 (상위 10개만 = 10회/일)
    for provider in TOP_10_PROVIDERS:
        await rapidapi.get("casino", f"/getallgamesandprovider?provider={provider}")

    # 월간 쿼터 예상: (1 + 10) × 30 = 330회 → Casino API 299회로 부족
    # → 상위 8개만 = (1 + 8) × 30 = 270회 → OK
```

**효과**: 유저 방문 시 항상 캐시 적중 → 체감 속도 향상 + 쿼터 절약

---

### 제안 2: 📊 게임 인기도 추적 + 추천 시스템

> **현재**: 게임 목록만 표시 (정렬 순서만 수동 관리)
> **제안**: 유저 행동 기반 인기도 자동 추적

```sql
CREATE TABLE game_popularity (
    game_id INTEGER NOT NULL REFERENCES games(id),
    date DATE NOT NULL,
    launch_count INTEGER DEFAULT 0,     -- 런칭 횟수
    unique_players INTEGER DEFAULT 0,   -- 순 플레이어
    total_bet DECIMAL(18,2) DEFAULT 0,  -- 총 베팅
    avg_session_minutes FLOAT DEFAULT 0, -- 평균 세션
    PRIMARY KEY (game_id, date)
);
```

**관리자 UI**: 인기 게임 TOP 20 차트 + 추천 순서 자동 조정

---

### 제안 3: 🏷️ 프로바이더 태그 & 필터 시스템

> **현재**: 카테고리(7종)만으로 분류
> **제안**: 다중 태그로 유연한 필터링

```
태그 예시:
- "신규" (최근 30일 추가)
- "인기" (월 런칭 100회+)
- "추천" (관리자 수동 지정)
- "프리스핀" (보너스 지원)
- "모바일최적화"
- "한국어지원"
```

---

### 제안 4: 💰 플랜 업그레이드 비용 분석 대시보드

> **현재**: 무료 플랜으로 시작
> **제안**: 사용 패턴 기반 최적 플랜 추천

```
현재 사용 패턴 기반 추천:
├─ Odds Feed: 무료 (500회로 충분) → 실시간 필요 시 Pro $5/월
├─ SportAPI7: Pro $15/월 필수 (50회로 부족)
├─ Casino API: 무료 (캐싱으로 299회 내 운용)
└─ 총 추천 비용: $15~$20/월
```

---

### 제안 5: 🔐 API Key 로테이션 시스템

> **현재**: 단일 API Key 하드코딩
> **제안**: 복수 키 + 자동 로테이션

```python
# 무료 계정 여러 개로 쿼터 확장 가능
RAPIDAPI_KEYS = [
    {"key": "key1...", "quota_remaining": 200},
    {"key": "key2...", "quota_remaining": 500},
]
# 잔량 가장 많은 키 자동 선택
```

---

### 제안 6: 📱 게임 데모 모드 (money=0)

> **API 지원**: `/getgameurl`에서 `money: 0` → 데모 모드
> **활용**: 관리자가 게임 품질 테스트, 유저 체험판 제공

---

## 3. 기술 규격 요약

### 신규 파일 (예상)

| 파일 | Phase | 설명 |
|------|-------|------|
| `services/rapidapi_client.py` | 0 | 공통 HTTP 클라이언트 |
| `services/quota_service.py` | 0 | 쿼터 관리 |
| `connectors/rapidapi_casino_connector.py` | 0 | 카지노 커넥터 |
| `connectors/rapidapi_sports_connector.py` | 0 | 스포츠 커넥터 |
| `api/v1/external_api.py` | 1~4 | 통합 라우터 |
| `services/sports_aggregator.py` | 3 | 스포츠 데이터 통합 |
| `models/external_api_log.py` | 4 | API 로그 모델 |
| `models/game_popularity.py` | 제안2 | 인기도 모델 |
| `frontend/external-api/page.tsx` | 4 | 모니터링 대시보드 |
| `frontend/sports-monitor/page.tsx` | 2 | 스포츠 모니터링 |

### 신규 테이블 (예상)

| 테이블 | Phase | 설명 |
|--------|-------|------|
| `external_api_logs` | 4 | API 호출 로그 |
| `game_popularity` | 제안2 | 게임 인기도 |

### 환경변수 추가

```
RAPIDAPI_KEY=
RAPIDAPI_ODDS_QUOTA=500
RAPIDAPI_SPORT_QUOTA=50
RAPIDAPI_CASINO_QUOTA=299
RAPIDAPI_STREAM_QUOTA=99
```

---

## 4. 비용 분석

### 무료 플랜 운용 전략

| API | 무료 쿼터 | 캐싱 전략 | 예상 실제 소모 |
|-----|-----------|-----------|----------------|
| Odds Feed | 500/월 | 30초 TTL | ~100회 (관리자 모니터링만) |
| SportAPI7 | 50/월 | 30초 TTL | ~30회 (관리자 모니터링만) |
| Casino | 299/월 | 1h~24h TTL | ~270회 (프리워밍) |
| Stream | 99/월 | - | 0회 (사용 안 함) |

### 유료 전환 시점

| 조건 | 권장 플랜 | 비용 |
|------|-----------|------|
| 유저사이트 오픈 (스포츠 실시간) | Odds Feed Pro | $5/월 |
| 유저사이트 오픈 (멀티스포츠) | SportAPI7 Pro | $15/월 |
| 대규모 유저 유입 (게임 런칭 폭증) | Casino Ultra | $999/월 |
| **최소 권장** | Odds Pro + Sport Pro | **$20/월** |

---

## 5. 단계별 완료 체크 프로토콜

> **모든 Task 완료 시 반드시:**

### Task 단위

1. ✅ 검증 체크리스트 **모든 항목** 통과
2. ✅ 이 문서의 해당 Task 체크박스 ☑️ 변경
3. ✅ 프론트엔드 빌드 확인 (`cd frontend && npx next build --webpack`)
4. ✅ 백엔드 서버 정상 기동 확인
5. ✅ CLAUDE.md 진행 상황 업데이트

### Phase 단위

1. ✅ Phase 내 모든 Task 완료
2. ✅ 전체 백엔드/프론트엔드 재시작 후 동작 확인
3. ✅ 쿼터 소모량 확인 (의도한 수준인지)
4. ✅ Redis 캐시 상태 확인
5. ✅ `git add` + `git commit` (Phase 단위)
6. ✅ CLAUDE.md에 Phase 완료 기록
7. ✅ 이 계획서에 Phase 완료 날짜 기록

### 중단 복구 가이드

- 각 Task는 **독립적으로 검증 가능** → 중단 시 마지막 통과 Task부터 재개
- `git log --oneline -5`로 마지막 커밋 확인
- 이 계획서의 체크리스트로 현재 위치 파악
- Redis 쿼터 카운터 확인: `redis-cli GET rapidapi:quota:{api}:{yyyy-mm}`

---

## 6. 진행 상태 트래커

| Phase | Task | 상태 | 검증 | 커밋 | 완료일 |
|-------|------|------|------|------|--------|
| 0 | 0-1: RapidAPI 공통 클라이언트 | ⬜ | ⬜ | - | - |
| 0 | 0-2: Redis 캐싱 레이어 | ⬜ | ⬜ | - | - |
| 0 | 0-3: 쿼터 관리 서비스 | ⬜ | ⬜ | - | - |
| 0 | 0-4: 커넥터 어댑터 | ⬜ | ⬜ | - | - |
| 1 | 1-1: 프로바이더 동기화 | ⬜ | ⬜ | - | - |
| 1 | 1-2: 게임 카탈로그 동기화 | ⬜ | ⬜ | - | - |
| 1 | 1-3: 게임 런칭 URL | ⬜ | ⬜ | - | - |
| 1 | 1-4: 관리 UI 강화 | ⬜ | ⬜ | - | - |
| 2 | 2-1: 스포츠 이벤트 프록시 | ⬜ | ⬜ | - | - |
| 2 | 2-2: 멀티 배당률 API | ⬜ | ⬜ | - | - |
| 2 | 2-3: 스포츠 모니터링 UI | ⬜ | ⬜ | - | - |
| 3 | 3-1: 멀티스포츠 라이브 | ⬜ | ⬜ | - | - |
| 3 | 3-2: e스포츠 전용 | ⬜ | ⬜ | - | - |
| 3 | 3-3: Odds+SportAPI7 통합 | ⬜ | ⬜ | - | - |
| 4 | 4-1: 모니터링 대시보드 | ⬜ | ⬜ | - | - |
| 4 | 4-2: API 호출 로그 | ⬜ | ⬜ | - | - |
| 4 | 4-3: 알림 시스템 | ⬜ | ⬜ | - | - |
| 5 | 5-1: 유저사이트 프록시 | ⬜ | ⬜ | - | - |
| 5 | 5-2: 유저 프론트엔드 연동 | ⬜ | ⬜ | - | - |
| 5 | 5-3: E2E 통합 검증 | ⬜ | ⬜ | - | - |

---

## 7. 우선순위 매트릭스

```
          높은 비즈니스 가치
               ▲
               │
    Phase 1    │   Phase 2
    (Casino)   │   (Odds)
               │
  ─────────────┼───────────────► 구현 난이도
               │
    Phase 0    │   Phase 3
    (Infra)    │   (SportAPI7)
               │
               │   Phase 4-5
               │   (Dashboard+E2E)
```

**실행 순서**: Phase 0 → 1 → 2 → 3 → 4 → 5

**이유**:
1. **Phase 0** (인프라): 모든 Phase의 기반, 반드시 선행
2. **Phase 1** (카지노): 가장 높은 비즈니스 가치, 쿼터 효율 최고
3. **Phase 2** (Odds): 스포츠 베팅 핵심, 상대적 저비용
4. **Phase 3** (SportAPI7): 풍부한 데이터지만 쿼터 극소 (50/월)
5. **Phase 4** (대시보드): 운영 모니터링, 급하지 않음
6. **Phase 5** (E2E): 모든 구현 완료 후 통합 검증

---

## 8. Agent Team 활용 전략

### Phase별 에이전트 구성

| Phase | 리드 | 백엔드 | 프론트엔드 | QA | 보안 |
|-------|------|--------|-----------|----|----|
| 0 | Opus 4.6 | 인프라 설계 | - | 캐시 검증 | API Key 관리 |
| 1 | Opus 4.6 | 커넥터 구현 | UI 강화 | 동기화 검증 | - |
| 2 | Opus 4.6 | 프록시 API | 모니터링 UI | 배당률 검증 | Rate Limit |
| 3 | Opus 4.6 | 통합 서비스 | - | 데이터 정합 | - |
| 4 | Opus 4.6 | 로그 시스템 | 대시보드 | 알림 검증 | - |
| 5 | Opus 4.6 | 프록시 | 유저사이트 | E2E | 인증 검증 |

### 병렬 작업 가능 구간

```
Phase 0: [Task 0-1] → [0-2, 0-3 병렬] → [0-4]
Phase 1: [Task 1-1] → [1-2, 1-3 병렬] → [1-4]
Phase 2: [Task 2-1, 2-2 병렬] → [2-3]
Phase 3: [Task 3-1, 3-2 병렬] → [3-3]
Phase 4: [Task 4-1, 4-2, 4-3 모두 병렬]
Phase 5: [Task 5-1] → [5-2] → [5-3]
```
