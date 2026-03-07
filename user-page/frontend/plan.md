# 게임사(프로바이더) 배너 구현 계획서

> 작성일: 2026-03-08
> 기반: research.md 분석 결과
> 상태: ✅ 전체 완료 (Phase 0~3)
> 최종 검토: 2026-03-08 (실제 코드 대조 + API 검증 + 빌드 확인)

---

## 1. 구현 접근 방식

### 핵심 전략: Gamblly 게임 API의 `image` 필드를 활용한 프로바이더 대표 이미지 자동 추출

Gamblly 프로바이더 API(`providers.php`)에는 이미지 URL이 없지만, 게임 API(`games.php`)의 각 게임에는 `image` 필드가 존재한다. 이를 활용하여:

1. **백엔드**: `_refreshAllGames()` 실행 시 각 프로바이더의 첫 번째 게임 이미지를 대표 이미지로 추출
2. **인터페이스 확장**: `GameProvider`에 `image?: string` 필드 추가 (백엔드 + 프론트엔드)
3. **프론트엔드**: `ProviderBannerCard`에서 `provider.image`를 `getProviderImage()`의 3번째 인자로 전달 (함수 자체는 이미 3번째 파라미터 `apiImageUrl`을 지원함)

### 왜 이 방식인가

- Gamblly 게임 데이터의 `image` 필드는 이미 CDN URL을 제공 (외부 이미지 수집 불필요)
- 기존 `_refreshAllGames()` 로직에서 이미 모든 게임을 순회하므로 추가 API 호출 없음
- `provider-images.ts`의 로컬 매핑은 폴백으로 유지 (Gamblly API 장애 시 안전망)
- `getProviderImage()` 함수는 이미 `apiImageUrl` 우선 → CODE 매핑 → NAME 매핑 → null 순서로 동작

### 콜드 스타트에 대한 결정: 경량 반환 방식 불채택

이전 계획에서 `getProvidersLightweight()`로 콜드 스타트 시 경량 목록을 즉시 반환하는 방식을 고려했으나 **불채택**:
- 경량 반환 시 `total=0`으로 반환됨
- 프론트엔드 `page.tsx:118`에 `providers.filter((p) => p.total > 0)` 필터가 있어 전부 제거됨
- 이 필터를 제거하면 게임이 0개인 프로바이더도 표시되는 부작용 발생
- **대신**: 기존 방식 유지 (캐시 없으면 전체 로드 후 반환). 콜드 스타트 최적화는 별도 과제로 분리.

---

## 2. 구현 전 필수 검증 사항

> 구현 시작 전 반드시 확인해야 할 항목

1. **Gamblly games.php API 응답에서 이미지 필드 확인**: 백엔드의 `Game` 인터페이스(line 49)에 `image?: string`이 정의되어 있지만, 실제 API 응답에서 이 필드가 채워지는지 런타임 확인 필요
   ```bash
   cd user-page/backend && npm run dev
   curl -s http://localhost:8003/api/games/providers-stats | jq '.data.providers[0]'
   # 이후 특정 프로바이더의 게임 API를 호출하여 image 필드 존재 여부 확인
   ```

2. **Gamblly CDN 도메인 확인**: 게임 이미지 URL의 호스트명 확인 → `<img>` 태그 사용 시 불필요, `<Image>` 컴포넌트 사용 시 `next.config.ts`에 추가 필요

---

## 3. 수정할 파일 목록

| # | 파일 경로 | 변경 유형 | 설명 |
|---|-----------|-----------|------|
| 1 | `backend/src/services/gamblly-game-service.ts` | 수정 | GameProvider에 image 추가, _refreshAllGames에서 대표 이미지 추출 |
| 2 | `frontend/src/stores/game-store.ts` | 수정 | GameProvider 인터페이스에 image 추가 |
| 3 | `frontend/src/app/(main)/page.tsx` | 수정 | ProviderBannerCard에서 provider.image를 getProviderImage 3번째 인자로 전달 |

> **변경 불필요 확인된 파일:**
> - `backend/src/routes/games.ts` — 기존 `/api/games/providers-stats` 엔드포인트가 `getProvidersWithStats()`를 호출하므로 서비스 레이어 변경만으로 충분
> - `frontend/src/lib/provider-images.ts` — `getProviderImage(code, name, apiImageUrl?)` 함수가 이미 3번째 파라미터를 지원하고, 우선순위도 apiImageUrl → CODE → NAME → null 순서로 올바르게 동작
> - `frontend/src/components/game/game-card.tsx` — 프로바이더 배너와 무관
> - `frontend/src/components/game/game-launch-modal.tsx` — 동일하게 무관

---

## 4. 각 변경 사항 코드 스니펫

### 4-1. `backend/src/services/gamblly-game-service.ts`

**GameProvider 인터페이스 확장 (line 34-40):**

```typescript
export interface GameProvider {
  code: string;
  name: string;
  ko: boolean;
  total: number;
  categories: Record<string, number>;
  image?: string;  // <-- 추가: 프로바이더 대표 게임 이미지 URL
}
```

**`_refreshAllGames()` 수정 (line 186-224) — 대표 이미지 추출 로직 추가:**

기존 코드의 `providerStats.push()` 부분(line 212-216)에 image 필드 추가:

```typescript
// 기존 코드 (line 212-216):
providerStats.push({
  ...provider,
  total: games.length,
  categories: typeCounts,
});

// 변경 후:
// 대표 이미지: 이미지가 있는 첫 번째 게임의 image 사용
const representativeImage = games.find(g => g.image)?.image;

providerStats.push({
  ...provider,
  total: games.length,
  categories: typeCounts,
  image: representativeImage,  // <-- 추가
});
```

> 참고: `getProvidersWithStats()` (line 228-240)는 수정하지 않음. 기존 로직(캐시 있으면 반환, 없으면 전체 로드)을 그대로 유지.

### 4-2. `frontend/src/stores/game-store.ts`

**GameProvider 인터페이스 확장 (line 10-16):**

```typescript
export interface GameProvider {
  code: string;
  name: string;
  ko: boolean;
  total: number;
  categories: Record<string, number>;
  image?: string;  // <-- 추가
}
```

### 4-3. `frontend/src/app/(main)/page.tsx`

**ProviderBannerCard 수정 (line 38-39):**

```typescript
function ProviderBannerCard({ provider, index }: { provider: GameProvider; index: number }) {
  // 변경: provider.image를 3번째 인자로 전달 (getProviderImage는 이미 이 파라미터를 지원함)
  const logoSrc = getProviderImage(provider.code, provider.name, provider.image);
  const [imgError, setImgError] = useState(false);
  // ... 나머지 동일
```

> `getProviderImage()` 함수 시그니처 (provider-images.ts:57):
> ```typescript
> export function getProviderImage(code: string, name: string, apiImageUrl?: string): string | null
> ```
> 이미 `apiImageUrl`을 첫 번째 우선순위로 반환하도록 구현되어 있음. 함수 자체 수정 불필요.

---

## 5. 구현 순서 및 TODO 리스트

### Phase 0: 사전 검증 (필수) — ✅ 완료 (2026-03-08)

- [x] 백엔드 서버 시작 후 Gamblly API 게임 응답에서 `image` 필드가 실제로 CDN URL을 반환하는지 확인
  - **결과: ❌ Gamblly API에 이미지 필드 없음**
  - `games.php` 응답 필드: `game_uid, game_name, game_type, lang, currency, status` (img 없음)
  - `providers.php` 응답 필드: `code, name, currency, lang, status` (이미지 없음)
- [x] 반환되는 이미지 URL의 도메인 기록 → 해당 없음 (이미지 필드 미존재)
- [x] **대응 조치**: 로컬 매핑(`provider-images.ts`) 확장 — 활성 프로바이더 코드에 맞게 CODE_TO_IMAGE/NAME_TO_IMAGE 업데이트
  - 매핑: 7/46 프로바이더 (15%), 게임 기준 1537/4699 (33%)
  - 나머지는 기존 텍스트+그라디언트 폴백으로 표시

### Phase 1: 백엔드 — 이미지 추출 (핵심)

- [x] `gamblly-game-service.ts`: `GameProvider` 인터페이스에 `image?: string` 추가 (line 40 부근)
- [x] `gamblly-game-service.ts`: `_refreshAllGames()`의 `providerStats.push()` 부분(line 212-216)에서 대표 이미지 추출하여 `image` 필드에 할당

### Phase 2: 프론트엔드 — 인터페이스 동기화 + 배너 연결

- [x] `game-store.ts`: `GameProvider` 인터페이스에 `image?: string` 추가 (line 16 부근)
- [x] `page.tsx`: `ProviderBannerCard`에서 `getProviderImage(provider.code, provider.name, provider.image)` 호출로 변경 (line 39, 3번째 인자 추가)

### Phase 3: 검증 — ✅ 완료 (2026-03-08)

- [x] 백엔드 서버 재시작 후 `/api/games/providers-stats` 응답에 `image` 필드 포함 확인
  - Gamblly API에 이미지 없으므로 `image` 필드는 undefined (JSON에서 생략됨)
  - 코드는 정상 동작 — API가 이미지를 제공하면 자동으로 사용할 준비 완료
- [x] 프론트엔드: 로컬 매핑된 7개 프로바이더는 로고 표시, 나머지 39개는 그라디언트 폴백
- [x] 이미지 없는 프로바이더는 기존 텍스트 + 그라디언트 폴백으로 표시되는지 확인
- [x] `npx next build --webpack` 빌드 성공 확인 (2회 — 코드 변경 전후)

---

## 6. 고려한 대안 방식과 선택하지 않은 이유

### 대안 A: 프로바이더 로고를 수동으로 108개 전부 수집

- **장점**: 고품질 로고, API 의존 없음
- **불채택 이유**: 108개 로고 수집 작업량 과다, 프로바이더 추가/삭제 시 수동 관리 필요, 저작권 문제 가능

### 대안 B: Gamblly API에 프로바이더 이미지 URL 필드 요청

- **장점**: 근본적 해결
- **불채택 이유**: 외부 API이므로 응답 스키마 변경 불가, 대응 시간 미정

### 대안 C: 프론트엔드에서 각 프로바이더의 첫 게임을 별도 API 호출하여 이미지 추출

- **장점**: 백엔드 변경 최소
- **불채택 이유**: 108개 프로바이더 x 개별 API = 과도한 네트워크 요청, UX 저하

### 대안 D: 프로바이더별 고정 그라디언트만 사용 (이미지 포기)

- **장점**: 구현 제로
- **불채택 이유**: "배너가 구현 안 됐다"는 문제를 해결하지 못함

### 대안 E: 콜드 스타트 경량 반환 (getProvidersLightweight)

- **장점**: 서버 재시작 직후 빈 화면 방지
- **불채택 이유**: 경량 반환 시 `total=0`으로 오며 프론트엔드 `total > 0` 필터(page.tsx:118)에 의해 전부 제거됨. 필터 제거 시 게임 0개인 프로바이더도 표시되는 부작용. 비용 대비 효과 부족.

### 선택된 방식: 백엔드에서 이미 순회하는 게임 데이터의 `image` 활용

- 추가 API 호출 없음 (기존 `_refreshAllGames` 흐름 재활용)
- 자동 갱신 (프로바이더 추가 시 자동 반영)
- 로컬 매핑은 폴백으로 유지 (이중 안전망)
- `getProviderImage()` 함수가 이미 apiImageUrl 우선 로직을 갖추고 있어 프론트 변경 최소

---

## 7. 트레이드오프 및 주의사항

### 트레이드오프

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 이미지 커버리지 | 18.5% (20/108) | 게임 이미지 있는 프로바이더만큼 증가 (실측 필요, 낙관적 추정 금지) |
| 이미지 품질 | 전용 로고 (고품질) | 게임 썸네일 (프로바이더 로고 아님) |
| 외부 이미지 의존 | 없음 (로컬만) | Gamblly CDN 의존 추가 |

### 주의사항

1. **프론트/백엔드 GameProvider 인터페이스 이중 정의**: `gamblly-game-service.ts:34-40`과 `game-store.ts:10-16`에 각각 정의되어 있으므로 양쪽 모두 `image` 추가 필수

2. **ProviderBannerCard가 page.tsx 내부 정의**: 별도 파일이 아니라 `page.tsx` 내부 함수이므로, 수정 범위가 해당 파일에 한정

3. **`<img>` 태그 사용 권장**: 게임 이미지(`game-card.tsx:46-51`)가 이미 `<img>` 태그를 사용하므로, 프로바이더 배너도 동일하게 `<img>` 사용. 이 경우 `next.config.ts`에 Gamblly CDN 도메인 추가 불필요.

4. **이미지 로드 실패 폴백**: `ProviderBannerCard`에 이미 `onError` → `setImgError(true)` → 텍스트+그라디언트 폴백이 구현되어 있으므로, API 이미지 URL이 깨져도 안전함

5. **커버리지 추정 주의**: ~95% 추정은 검증되지 않음. Phase 0 사전 검증에서 실제 비율 확인 후 이 문서 업데이트 필요

---

## 8. 테스트 방법

### 8-1. 사전 검증 (Phase 0)

```bash
# 서버 시작
cd user-page/backend && npm run dev

# 임의 프로바이더의 게임 목록에서 image 필드 확인
# (실제 엔드포인트는 코드 확인 후 결정)
```

### 8-2. 백엔드 API 검증

```bash
# 프로바이더 stats 호출 -- image 필드 포함 확인
curl -s http://localhost:8003/api/games/providers-stats | jq '.data.providers[0]'
# 예상 출력: { "code": "PP", "name": "PP", "ko": true, "total": 500, "image": "https://..." }

# image가 null인 프로바이더도 있을 수 있음 (게임에 이미지가 없는 경우)
curl -s http://localhost:8003/api/games/providers-stats | jq '[.data.providers[] | select(.image != null)] | length'
# 이미지가 있는 프로바이더 수 확인
```

### 8-3. 프론트엔드 UI 검증

```bash
cd user-page/frontend && npx next dev --port 3002 --webpack
# 브라우저에서 http://localhost:3002 접속
# 메인 로비 "게임사" 섹션에서:
# 1. 프로바이더 카드에 이미지가 표시되는지 확인
# 2. 이미지 없는 프로바이더는 텍스트 + 그라디언트 폴백 확인
# 3. 프로바이더 클릭 -> /games?provider=CODE 이동 확인
```

### 8-4. 빌드 검증

```bash
cd user-page/frontend && npx next build --webpack
# 빌드 성공 확인 (0 errors)
```

### 8-5. 엣지 케이스

- Gamblly API 장애 시 -> 로컬 매핑 폴백(CODE_TO_IMAGE, NAME_TO_IMAGE)이 동작하는가?
- 게임이 0개인 프로바이더 -> 배너에 표시되지 않아야 함 (기존 `total > 0` 필터)
- 이미지 로드 실패 -> `onError` -> 텍스트 폴백이 동작하는가?
- 모든 게임에 image가 null인 프로바이더 -> `representativeImage`가 undefined → 폴백 동작 확인
