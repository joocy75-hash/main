# RapidAPI Reference Guide

> Last verified: 2026-02-24
> All APIs are on **Basic (Free) Plan** - $0.00/mo with quota limits

## Authentication

```
API Key: ${RAPIDAPI_KEY}
```

All requests require these headers:

```
x-rapidapi-key: ${RAPIDAPI_KEY}
x-rapidapi-host: {host}
```

JavaScript fetch example:

```javascript
const API_KEY = '${RAPIDAPI_KEY}';

const apiFetch = async (host, path, options = {}) => {
  const r = await fetch('https://' + host + path, {
    ...options,
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': host,
      ...options.headers
    }
  });
  if (!r.ok) throw new Error(r.status + ' ' + r.statusText);
  return r.json();
};
```

---

## 1. Odds Feed API (Sports Betting Odds)

| Item | Value |
|------|-------|
| Host | `odds-feed.p.rapidapi.com` |
| Status | **Working** |
| Category | Sports Betting |
| Quota Usage | 11.2% |
| RapidAPI | https://rapidapi.com/tipsters/api/odds-feed |
| Provider | tipsters |

### Endpoints

#### GET /api/v1/events

Live, scheduled, or finished sports events with inline odds.

```
GET https://odds-feed.p.rapidapi.com/api/v1/events?status=LIVE
```

**Parameters:**
| Param | Required | Values |
|-------|----------|--------|
| status | Yes | `LIVE`, `FINISHED`, `SCHEDULED`, `CANCELLED`, `DELAYED`, `INTERRUPTED`, `POSTPONED`, `ABANDONED` |

**Response Structure:**
```json
{
  "data": [
    {
      "id": 491464,
      "sport": { "name": "Football", "slug": "football" },
      "tournament": { "name": "La Liga" },
      "team_home": { "name": "Real Madrid" },
      "team_away": { "name": "Barcelona" },
      "score_home": 2,
      "score_away": 1,
      "score_details": "1:0, 1:1",
      "status": "LIVE",
      "status_details": "2nd Half",
      "comments": "67'",
      "main_outcome_0": 1.85,
      "main_outcome_1": 3.50,
      "main_outcome_2": 4.20,
      "main_volume_1": 125000,
      "main_volume_2": 98000
    }
  ]
}
```

**Key Fields:**
- `main_outcome_0` = Home win odds (1)
- `main_outcome_1` = Draw odds (X)
- `main_outcome_2` = Away win odds (2)
- `main_volume_1/2` = Trading volume
- `score_details` = Period-by-period scores (comma separated)

#### GET /api/v1/markets/feed

Multi-bookmaker odds for specific events. Returns detailed market data from 7+ bookmakers.

```
GET https://odds-feed.p.rapidapi.com/api/v1/markets/feed?event_ids=491464
```

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| event_ids | Yes | Event ID (from /events endpoint) |

**Response Structure:**
```json
{
  "data": [
    {
      "market_name": "1X2",
      "value": null,
      "market_books": [
        {
          "book": "BETFAIR_EXCHANGE",
          "outcome_0": 1.85,
          "outcome_1": 3.50,
          "outcome_2": 4.20
        },
        {
          "book": "1XBET",
          "outcome_0": 1.90,
          "outcome_1": 3.40,
          "outcome_2": 4.10
        }
      ]
    },
    {
      "market_name": "OVER_UNDER",
      "value": 2.5,
      "market_books": [...]
    }
  ]
}
```

**Available Bookmakers:** BETFAIR_EXCHANGE, 1XBET, STAKE, BWIN, UNIBET, BET365, PINNACLE

**Available Markets:** 1X2, OVER_UNDER, BOTH_TEAMS_TO_SCORE, DOUBLE_CHANCE, ASIAN_HANDICAP, etc. (83+ markets per event)

---

## 2. SportAPI7 (Multi-Sport Live Data)

| Item | Value |
|------|-------|
| Host | `sportapi7.p.rapidapi.com` |
| Status | **Working** |
| Category | Sports Data |
| Quota Usage | 30% |
| RapidAPI | https://rapidapi.com/rapidsportapi/api/sportapi7 |

### Endpoints

#### GET /api/v1/sport/{sport}/events/live

Real-time live events by sport category.

```
GET https://sportapi7.p.rapidapi.com/api/v1/sport/football/events/live
GET https://sportapi7.p.rapidapi.com/api/v1/sport/esports/events/live
GET https://sportapi7.p.rapidapi.com/api/v1/sport/tennis/events/live
GET https://sportapi7.p.rapidapi.com/api/v1/sport/basketball/events/live
```

**Available Sports:** `football`, `tennis`, `basketball`, `esports`, `hockey`, `baseball`, `volleyball`, `mma`, etc. (20+ sports)

**Response Structure (Football):**
```json
{
  "events": [
    {
      "id": 12345678,
      "homeTeam": {
        "name": "Manchester United",
        "nameCode": "MUN",
        "id": 35
      },
      "awayTeam": {
        "name": "Liverpool",
        "nameCode": "LIV",
        "id": 44
      },
      "homeScore": {
        "current": 2,
        "display": 2,
        "period1": 1,
        "period2": 1
      },
      "awayScore": {
        "current": 1,
        "display": 1,
        "period1": 0,
        "period2": 1
      },
      "tournament": {
        "name": "Premier League",
        "category": { "name": "England" }
      },
      "season": { "name": "Premier League 24/25" },
      "status": {
        "code": 7,
        "description": "2nd half",
        "type": "inprogress"
      }
    }
  ]
}
```

**Response Structure (Esports):**
```json
{
  "events": [
    {
      "homeTeam": { "name": "NAVI" },
      "awayTeam": { "name": "FaZe Clan" },
      "homeScore": { "current": 1, "display": 1 },
      "awayScore": { "current": 0, "display": 0 },
      "tournament": {
        "name": "ESL Pro League",
        "category": { "name": "Counter-Strike" }
      },
      "bestOf": 3,
      "status": {
        "description": "2nd map",
        "type": "inprogress"
      }
    }
  ]
}
```

**Esports Categories:** Counter-Strike (CS2), League of Legends, Dota 2, Valorant, etc.

---

## 3. Live Casino & Slots API (100+ Game Providers)

| Item | Value |
|------|-------|
| Host | `live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com` |
| Status | **Working** |
| Category | Casino Gaming |
| Quota Usage | 30% |
| RapidAPI | https://rapidapi.com/betnex2026/api/live-casino-slots-evolution-jili-and-50-plus-provider |

### Endpoints

#### GET /getallproviders

Returns all available game providers (100+).

```
GET https://live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com/getallproviders
```

**Response:**
```json
{
  "success": true,
  "message": "All games grouped by provider fetched successfully",
  "games": [
    "EVOLUTIONLIVE", "PRAGMATICLIVE", "PRAGMATICSLOTS", "JILIGAMING",
    "JDB", "PGSOFT", "SPADEGAMING", "HABANERO", "CQ9", "MICROGAMING",
    "NETENT", "HACKSAW", "REDTIGER", "BGAMING", "SPRIBE", "PLAYSON",
    "BTISPORTS", "SABASPORTS", "SAGAMING", "EZUGI", "PLAYTECHLIVE",
    "PLAYTECHSLOTS", "EVOPLAY", "ENDORPHINA", "RELAXGAMING",
    "BIGTIMEGAMING", "PLAYNGO", "FASTSPIN", "RICH88", "WMCASINO",
    "DREAMGAMING", "SMARTSOFT", "SEXYGAMING", "SKYWIND",
    ...
  ]
}
```

**Major Provider Categories:**
- Live Casino: `EVOLUTIONLIVE`, `EZUGI`, `PRAGMATICLIVE`, `SAGAMING`, `PLAYTECHLIVE`, `DREAMGAMING`, `WMCASINO`, `SEXYGAMING`
- Slots: `PRAGMATICSLOTS`, `PGSOFT`, `JILIGAMING`, `JDB`, `CQ9`, `HABANERO`, `SPADEGAMING`, `MICROGAMING`, `NETENT`, `HACKSAW`, `REDTIGER`, `PLAYTECHSLOTS`
- Sports: `BTISPORTS`, `SABASPORTS`, `DPSPORTS`, `CMDSPORTS`
- Others: `SPRIBE` (mini games), `BGAMING`, `EVOPLAY`, `SMARTSOFT`

#### GET /getallgamesandprovider

Returns all games for a specific provider.

```
GET https://live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com/getallgamesandprovider?provider=EVOLUTIONLIVE
```

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| provider | Yes | Provider name (from /getallproviders) |

**Response:**
```json
{
  "success": true,
  "games": [
    {
      "name": "French Roulette Gold",
      "id": "36b1e71c6f51827e24261d06a22b1e31",
      "img": "https://cdn.betnex.co/images/evolutionlive/0.png",
      "provider": "EVOLUTIONLIVE"
    },
    {
      "name": "Lightning Roulette",
      "id": "a8b2c3d4e5f6...",
      "img": "https://cdn.betnex.co/images/evolutionlive/1.png",
      "provider": "EVOLUTIONLIVE"
    }
  ]
}
```

**Game Counts (examples):**
- EVOLUTIONLIVE: 420 games
- PRAGMATICSLOTS: 300+ games
- JILIGAMING: 200+ games

#### POST /getgameurl

Generates a temporary game launch URL (expires in 60 seconds).

```
POST https://live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com/getgameurl
Content-Type: application/json
```

**Request Body:**
```json
{
  "username": "testuser01",
  "gameId": "36b1e71c6f51827e24261d06a22b1e31",
  "lang": "en",
  "money": 0,
  "home_url": "https://your-site.com",
  "platform": 1,
  "currency": "USD"
}
```

| Field | Type | Description |
|-------|------|-------------|
| username | string | Player username |
| gameId | string | Game ID (from /getallgamesandprovider) |
| lang | string | Language code (en, ko, etc.) |
| money | number | Initial balance (0 for demo) |
| home_url | string | Return URL after game exit |
| platform | number | 1 = desktop, 2 = mobile |
| currency | string | USD, KRW, INR, etc. |

**Response:**
```json
{
  "code": 0,
  "msg": "Success",
  "payload": {
    "game_launch_url": "https://livecasinoapi.betnex.co/game?token=xxx&dtoken=xxx",
    "game_name": "French Roulette Gold",
    "provider": "EVOLUTIONLIVE",
    "expires_in": 60
  }
}
```

---

## Dead/Non-Working APIs (Do Not Use)

| API | Host | Issue |
|-----|------|-------|
| Esports Data | `esports-data2.p.rapidapi.com` | 404 "API doesn't exists" |
| Bac Bo Brazilian | `bac-bo-brazilian-api.p.rapidapi.com` | Backend down (serveo.net tunnel) |
| IGAMING API Solution | `igaming-api-solution-like-jili-jdb-evolution.p.rapidapi.com` | Kafka streaming API, not REST |
| Slot and Betting Games | `slot-and-betting-games.p.rapidapi.com` | S3 bucket error (backend down) |

---

## Quick Integration Guide

### Sports Dashboard (Live Scores + Odds)

```javascript
const API_KEY = '${RAPIDAPI_KEY}';

// 1. Get live events with odds
const events = await apiFetch('odds-feed.p.rapidapi.com', '/api/v1/events?status=LIVE');

// 2. Get detailed multi-bookmaker odds for an event
const markets = await apiFetch('odds-feed.p.rapidapi.com', '/api/v1/markets/feed?event_ids=' + eventId);

// 3. Get live esports matches
const esports = await apiFetch('sportapi7.p.rapidapi.com', '/api/v1/sport/esports/events/live');

// 4. Get live football with rich team data
const football = await apiFetch('sportapi7.p.rapidapi.com', '/api/v1/sport/football/events/live');
```

### Casino Integration (Providers + Games + Launch)

```javascript
// 1. Get all providers
const providers = await apiFetch(
  'live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com',
  '/getallproviders'
);

// 2. Get games for a provider
const games = await apiFetch(
  'live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com',
  '/getallgamesandprovider?provider=EVOLUTIONLIVE'
);

// 3. Launch a game
const launch = await fetch(
  'https://live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com/getgameurl',
  {
    method: 'POST',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'live-casino-slots-evolution-jili-and-50-plus-provider.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: 'player01',
      gameId: 'GAME_ID_HERE',
      lang: 'ko',
      money: 0,
      home_url: 'https://your-site.com',
      platform: 1,
      currency: 'KRW'
    })
  }
).then(r => r.json());

// 4. Open game
window.open(launch.payload.game_launch_url, '_blank');
```

---

## Quota & Rate Limits (Current Plan: Basic Free)

| API | Free Quota | Rate Limit | Hard Limit? |
|-----|-----------|------------|-------------|
| Odds Feed | 500회/월 | 1,000 req/hour | Yes (초과 시 차단) |
| SportAPI7 | 50회/월 | 1,000 req/hour | Yes (초과 시 차단) |
| Casino API | 299회/월 | 1,000 req/hour | Yes (초과 시 차단) |

> All APIs include **Bandwidth Platform Fee**: 10,240MB/mo, +$0.001/MB over

**Subscription Management:** https://rapidapi.com/console/7001299/billing/subscriptions-and-usage

**Recommendation:** Auto-refresh interval 30 seconds minimum to conserve quota.

---

## Pricing Plans (Paid Upgrade Options)

### Odds Feed API - Pricing

| Plan | Price | Quota | Overage | Rate Limit |
|------|-------|-------|---------|------------|
| Basic | $0/mo | 500/mo (Hard) | N/A | 1,000/hour |
| **Pro** | **$5/mo** | 5,000/mo | +$0.003/req | 5/sec |
| Ultra | $39/mo | 260,000/mo | +$0.002/req | 7/sec |
| **Mega** (Best) | **$59/mo** | 2,400,000/mo | +$0.001/req | 10/sec |

> Pricing: https://rapidapi.com/tipsters/api/odds-feed/pricing

### SportAPI7 - Pricing

| Plan | Price | Quota | Overage | Rate Limit |
|------|-------|-------|---------|------------|
| Basic | $0/mo | 50/mo (Hard) | N/A | 1,000/hour |
| Pro | $15/mo | 15,000/mo (Hard) | N/A | 20/sec |
| Ultra | $100/mo | 150,000/mo (Hard) | N/A | 50/sec |
| Mega | $500/mo | 2,000,000/mo | +$0.001/req | 100/sec |

> Basic~Ultra all Hard Limit (no overage). Only Mega allows overage billing.
> Pricing: https://rapidapi.com/rapidsportapi/api/sportapi7/pricing

### Live Casino & Slots API - Pricing

| Plan | Price | Quota | Overage | Rate Limit |
|------|-------|-------|---------|------------|
| Basic | $0/mo | 299/mo (Hard) | N/A | 1,000/hour |
| **Ultra** | **$999/mo** | 49,999/mo (Hard) | N/A | Unlimited |

> Only 2 plans available! No Pro/Mega. Jump from Free → $999/mo.
> Pricing: https://rapidapi.com/betnex2026/api/live-casino-slots-evolution-jili-and-50-plus-provider/pricing

### Cost Summary (Upgrade Comparison)

| API | Cheapest Paid | Best Value | Notes |
|-----|--------------|------------|-------|
| Odds Feed | Pro $5/mo | Mega $59/mo | Most affordable upgrade |
| SportAPI7 | Pro $15/mo | Ultra $100/mo | Free plan only 50 calls! |
| Casino API | Ultra $999/mo | Ultra $999/mo | No mid-tier option |
