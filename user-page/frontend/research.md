# 프로바이더 배너 구현 문제 분석 보고서

> 분석일: 2026-03-08
> 대상: user-page/frontend (유저 프론트엔드)
> 목적: 게임사(프로바이더) 배너가 구현되지 않는 원인 심층 분석

---

## 1. 전체 구조 및 아키텍처

### 데이터 흐름

```
Gamblly API (외부)
    ↓ HTTP (providers.php, games.php)
GambllyGameService (backend/src/services/gamblly-game-service.ts)
    ↓ In-memory cache (24h providers, 1h games)
Game Routes (backend/src/routes/games.ts)
    ↓ REST API (/api/games/providers-stats, /api/games/all)
ApiClient (frontend/src/lib/api-client.ts)
    ↓ fetch + auto-unwrap { success, data }
GameStore (frontend/src/stores/game-store.ts)
    ↓ Zustand state (providers[], games[])
Page Components (page.tsx, games/page.tsx)
    ↓ props
ProviderBannerCard / GameCard / GameLaunchModal
    ↓ getProviderImage() 호출
provider-images.ts (이미지 매핑)
```

### 핵심 파일 목록

| 파일 | 역할 |
|------|------|
| `backend/src/services/gamblly-game-service.ts` | Gamblly API 호출, 프로바이더/게임 데이터 가공 및 캐싱 |
| `backend/src/routes/games.ts` | REST 엔드포인트 7개 (categories, providers, all, search, launch, demo) |
| `backend/src/config.ts` | Gamblly API 키, 서버 URL 등 환경변수 |
| `frontend/src/stores/game-store.ts` | Zustand 스토어 - providers[], games[] 상태 관리 |
| `frontend/src/lib/provider-images.ts` | 프로바이더 코드/이름 → 로컬 이미지 경로 매핑 |
| `frontend/src/lib/api-client.ts` | HTTP 클라이언트 (자동 토큰 갱신, `{ success, data }` 언래핑) |
| `frontend/src/app/(main)/page.tsx` | 메인 로비 - **ProviderBannerCard** 컴포넌트 사용 |
| `frontend/src/app/(main)/games/page.tsx` | 게임 목록 - 프로바이더 필터 칩 사용 |
| `frontend/src/components/game/game-card.tsx` | 개별 게임 카드 UI |
| `frontend/src/components/game/game-launch-modal.tsx` | 게임 실행 모달 |

---

## 2. 프로바이더 배너 관련 핵심 발견 사항

### 2-1. 배너가 표시되는 위치

메인 로비 (`page.tsx:236-289`)의 "게임사" 섹션에서 `ProviderBannerCard` 컴포넌트로 프로바이더 배너를 렌더링한다.

### 2-2. 배너 데이터 로딩 흐름

1. `page.tsx:112-114` — `useEffect`에서 `fetchProvidersOnly()` 호출
2. `game-store.ts:79-92` — `/api/games/providers-stats` API 호출
3. `games.ts:27-39` — `gameService.getProvidersWithStats()` 호출
4. `gamblly-game-service.ts:228-240` — `allGamesCache`가 없으면 `getAllGames()` → `_refreshAllGames()` 호출

### 2-3. 핵심 문제: `getProvidersWithStats()`의 콜드 스타트 동작

```typescript
// gamblly-game-service.ts:228-240
async getProvidersWithStats(): Promise<GameProvider[]> {
    if (allGamesCache) {
      // 캐시 있으면 반환 + 필요시 백그라운드 갱신
      return allGamesCache.providers;
    }
    // 캐시 없으면 → getAllGames() 호출 (전체 프로바이더 * 게임 로드)
    const result = await this.getAllGames();
    return result.providers;
  }
```

**첫 요청(콜드 스타트) 시 `_refreshAllGames()`가 108개 프로바이더의 모든 게임을 5개씩 배치로 순차 fetch합니다.**
- 108 프로바이더 / 5 배치 = 22 라운드
- 각 프로바이더마다 페이지네이션(100개씩) 포함
- 타임아웃: 15초/요청
- **예상 소요 시간: 30초~2분+**

이 동안 프론트엔드는 `isLoading: true` 상태에 머물러 아무 배너도 표시되지 않는다.

### 2-4. 핵심 문제: 프로바이더 이미지 매핑 커버리지 부족

`provider-images.ts`에서 매핑된 프로바이더:
- **CODE_TO_IMAGE**: 12개 (PTASIA, PP, PPLIVE, MG, JL, HABANERO, PG, KM, EZUGI, FACHAI, SPRIBE, SABA)
- **NAME_TO_IMAGE**: 20개 (위 12개 + evolution, bti, im, og, mwg, marblemagic 등)

**Gamblly API는 108개 프로바이더를 반환한다.** 따라서:
- 로고 이미지가 있는 프로바이더: **~20개 (18.5%)**
- 로고 없는 프로바이더: **~88개 (81.5%)** → 텍스트 이름만 표시

실제 `public/images/providers/` 폴더에 15개 webp 파일, `provider-filters/` 폴더에 18개 webp 파일이 있지만, `provider-filters/` 파일 대부분은 매핑에 사용되지 않고 있다.

### 2-5. Gamblly API가 이미지 URL을 제공하지 않는 구조적 문제

```typescript
// gamblly-game-service.ts:102-110 — providers API 응답 파싱
const providers: GameProvider[] = (result.data as Array<{
  code: string; name: string; status?: number; lang?: string[]
}>)
.map(p => ({
  code: p.code,
  name: p.name,
  ko: !!(p.lang && p.lang.includes('ko')),
  total: 0,
  categories: {},
}));
```

- Gamblly API의 프로바이더 응답에는 **이미지 URL 필드가 없다** (code, name, status, lang만 존재)
- `GameProvider` 인터페이스에도 **image 필드가 없다** (`game-store.ts:10-16`, `gamblly-game-service.ts:34-40`)
- 따라서 프론트엔드는 `provider-images.ts`의 하드코딩 매핑에 100% 의존

### 2-6. ProviderBannerCard의 폴백 동작

```typescript
// page.tsx:38-91
function ProviderBannerCard({ provider, index }) {
  const logoSrc = getProviderImage(provider.code, provider.name);
  // apiImageUrl 파라미터 없이 호출 → 항상 null (API에 이미지 없으므로)
  const showLogo = logoSrc && !imgError;
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  // showLogo = false → 텍스트만 표시
}
```

**88개 프로바이더가 로고 없이 텍스트만 표시되므로 "배너가 구현 안 됐다"고 보이는 것이 핵심 원인이다.**

---

## 3. 데이터 흐름 및 처리 방식 상세

### 3-1. 백엔드 캐싱 전략

| 캐시 대상 | TTL | 저장소 |
|-----------|-----|--------|
| 프로바이더 목록 | 24시간 | `providersCache` (in-memory) |
| 프로바이더별 게임 | 1시간 | `gamesCache` (Map, in-memory) |
| 전체 게임+프로바이더 통계 | 1시간 | `allGamesCache` (in-memory) |

- 서버 재시작 시 모든 캐시 소실 → 콜드 스타트 문제 재발
- `stale-while-revalidate` 패턴 사용: 캐시 만료 시 구데이터 즉시 반환 + 백그라운드 갱신

### 3-2. 프론트엔드 API 호출 패턴

| 페이지 | API 호출 | 트리거 |
|--------|---------|--------|
| 메인 로비 (`/`) | `GET /api/games/providers-stats` | `useEffect` on mount |
| 게임 목록 (`/games`) | `GET /api/games/all` | `useEffect` when `games.length === 0` |

- `game-store.ts`의 `hasFetchedProviders`/`hasFetchedAll` 플래그로 중복 호출 방지
- 메인 로비는 프로바이더만 로드 (`fetchProvidersOnly`)
- 게임 목록은 전체 게임+프로바이더 로드 (`fetchAllGames`)

### 3-3. 프론트엔드 이미지 해결 우선순위

`getProviderImage(code, name, apiImageUrl?)`:
1. `apiImageUrl` 파라미터가 있으면 그대로 사용 → **현재 호출 시 항상 생략됨**
2. `CODE_TO_IMAGE[code]` 매칭 → 12개만 매핑
3. `NAME_TO_IMAGE[name.toLowerCase()]` 매칭 → 20개만 매핑
4. 전부 실패 → `null` 반환

---

## 4. 기존 패턴 및 컨벤션

### 사용 중인 패턴

- **Zustand 스토어**: 전역 상태 관리 (auth, game, wallet, sports, profile, event, minigame)
- **API Client**: `api-client.ts`에서 `{ success, data }` 래핑 자동 해제
- **Next.js App Router**: `(main)` 레이아웃 그룹 + `(auth)` 그룹
- **shadcn/ui + TailwindCSS 4**: UI 컴포넌트 기반
- **In-memory 캐싱**: 백엔드에서 Redis 대신 변수 캐시 사용 (게임 관련)
- **Suspense + Lazy Loading**: `games/page.tsx`에서 `useSearchParams` 때문에 Suspense 래핑

### 컬러 컨벤션

- 배경: `#f9fafb` (밝은), `#f1f2f7` (약간 어두운)
- 텍스트: `#252531` (메인), `#6b7280` (서브), `#98a7b5` (약한)
- 강조: `#feb614` (골드/액센트)
- 보더: `#e8e8e8`

---

## 5. 변경 시 영향받을 수 있는 연관 부분

### 프로바이더 이미지 추가/변경 시

| 파일 | 영향 |
|------|------|
| `provider-images.ts` | CODE_TO_IMAGE / NAME_TO_IMAGE 매핑 추가 필요 |
| `public/images/providers/` | 실제 이미지 파일 추가 필요 |
| `page.tsx (ProviderBannerCard)` | 이미지 표시 로직 (현재 정상 동작) |
| `game-card.tsx` | 게임 카드 썸네일 폴백 로직 |
| `game-launch-modal.tsx` | 모달 프리뷰 이미지 |

### GameProvider 인터페이스 변경 시

| 파일 | 영향 |
|------|------|
| `gamblly-game-service.ts:34-40` | 백엔드 인터페이스 정의 |
| `game-store.ts:10-16` | 프론트엔드 인터페이스 정의 (별도 - 동기화 필요) |
| `page.tsx` | ProviderBannerCard props |
| `games/page.tsx` | categoryProviders 사용 |

### 배너 UI 수정 시

| 파일 | 영향 |
|------|------|
| `page.tsx:38-91` | ProviderBannerCard 컴포넌트 |
| `page.tsx:23-34` | CARD_GRADIENTS 배열 |
| `globals.css` | 마키 애니메이션 등 글로벌 스타일 |

---

## 6. 문제 원인 요약 및 리스크

### 근본 원인 (Root Causes)

| # | 원인 | 심각도 | 설명 |
|---|------|--------|------|
| **RC-1** | Gamblly API에 프로바이더 이미지 URL 없음 | HIGH | API 응답에 img 필드 없어 로컬 매핑에 의존 |
| **RC-2** | 로컬 이미지 매핑 커버리지 18.5% | **CRITICAL** | 108개 중 20개만 매핑 → 88개가 텍스트만 표시 |
| **RC-3** | 콜드 스타트 시 로딩 30초~2분 | HIGH | 108개 프로바이더 전체 게임을 순차 fetch해야 stats 생성 |
| **RC-4** | GameProvider 인터페이스에 image 필드 없음 | MEDIUM | API에서 받을 수 없어 필드 자체가 설계에 없음 |
| **RC-5** | `provider-filters/` 이미지 18개 미활용 | LOW | 파일은 있지만 2개만 매핑됨 (MG, HABANERO) |

### 해결 방향 (구현 전 참고)

1. **이미지 커버리지 확대**: Gamblly 게임 API의 `img` 필드에서 프로바이더 대표 이미지를 추출하거나, 외부에서 프로바이더 로고를 수집하여 `provider-images.ts` 매핑 확대
2. **GameProvider에 image 필드 추가**: 백엔드에서 게임 목록의 첫 번째 이미지를 프로바이더 대표 이미지로 설정
3. **콜드 스타트 최적화**: `getProvidersWithStats()`가 전체 게임 로드 없이 프로바이더만 빠르게 반환하도록 분리
4. **`provider-filters/` 이미지 활용**: 기존 미사용 이미지를 매핑에 추가

### 주의사항

- `gamblly-game-service.ts`는 **싱글톤 인스턴스** (`const gameService = new GambllyGameService()`) — 캐시가 프로세스 생명주기에 묶임
- `allGamesRefreshing` 플래그는 동시 갱신 방지용이지만, 서버 크래시 시 stuck 가능성 없음 (finally 블록)
- 프론트엔드 `GameProvider`와 백엔드 `GameProvider` 인터페이스는 **별도 정의** — 필드 추가 시 양쪽 동기화 필수
- `ProviderBannerCard`는 `page.tsx` 내부 함수 컴포넌트 — 별도 파일로 분리되지 않았음
- Next.js Image 컴포넌트 사용 → 외부 URL 이미지 추가 시 `next.config.ts`의 `images.remotePatterns` 설정 필요
