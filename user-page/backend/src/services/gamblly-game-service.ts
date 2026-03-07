import { config } from '../config.js';

const { apiKey, playerPrefix, serverUrl } = config.gamblly;

// Game type → category mapping
const TYPE_CATEGORY_MAP: Record<string, string> = {
  'Slot': 'slot', 'Cluster': 'slot', 'Fruit': 'slot',
  'Casino Live': 'live', 'Lobby': 'live',
  'Crash': 'crash', 'Turbo': 'crash', 'Step Flow': 'crash', 'Plinko': 'crash',
  'Table': 'table', 'Card': 'table', 'Poker': 'table', 'BlackJack': 'table',
  'Baccarat': 'table', 'Roulette': 'table', 'Hundred-player': 'table',
  'Sports': 'sports', 'Esports': 'sports',
  'Fish': 'arcade', 'Arcade': 'arcade', 'Mini': 'arcade',
  'Wheel of Fortune': 'arcade', 'Dice': 'arcade', 'Tower': 'arcade',
  'Instant': 'instant', 'Scratch cards': 'instant', 'Lucky tapper': 'instant',
  'Casino': 'casino', 'Keno': 'casino', 'Bingo': 'casino', 'Marbles': 'casino',
  'Multiplayer': 'casino', 'Lottery': 'casino',
  'Blockchain': 'other', 'Original': 'other', 'Cockfighting': 'other',
  'Infinity Play': 'other', 'Other': 'other', 'None': 'other',
};

export const GAME_CATEGORIES = [
  { id: 'all', name: '전체', icon: '🎮' },
  { id: 'live', name: '라이브카지노', icon: '🎰' },
  { id: 'slot', name: '슬롯', icon: '🍒' },
  { id: 'crash', name: '크래시', icon: '🚀' },
  { id: 'table', name: '테이블', icon: '🃏' },
  { id: 'sports', name: '가상스포츠', icon: '⚽' },
  { id: 'arcade', name: '아케이드', icon: '🕹️' },
  { id: 'casino', name: '카지노', icon: '🎲' },
  { id: 'instant', name: '인스턴트', icon: '⚡' },
] as const;

export interface GameProvider {
  code: string;
  name: string;
  ko: boolean;
  total: number;
  categories: Record<string, number>;
  image?: string;
}

export interface Game {
  uid: string;
  name: string;
  provider: string;
  providerName: string;
  type: string;
  category: string;
  image?: string;
  ko: boolean;
  status: number;
}

interface GambllyApiResponse {
  code: number;
  msg?: string;
  data?: unknown;
  payload?: unknown;
  total?: number;
  page?: number;
  per_page?: number;
}

// In-memory cache
let providersCache: GameProvider[] | null = null;
let providersCacheTime = 0;
const gamesCache = new Map<string, { games: Game[]; time: number }>();
let allGamesCache: { providers: GameProvider[]; games: Game[]; time: number } | null = null;

const PROVIDERS_TTL = 24 * 60 * 60 * 1000; // 24h
const GAMES_TTL = 60 * 60 * 1000; // 1h
const ALL_GAMES_TTL = 60 * 60 * 1000; // 1h (was 10min — too frequent for 100+ provider fetches)
let allGamesRefreshing = false;

async function gambllyRequest(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<GambllyApiResponse> {
  const url = `${serverUrl}${path}`;
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(15000),
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);
  return res.json() as Promise<GambllyApiResponse>;
}

// Home URL for game exit redirect (must not contain "?")
const homeUrl = config.corsOrigins[0] || 'http://localhost:3002';

export class GambllyGameService {
  async getProviders(forceRefresh = false): Promise<GameProvider[]> {
    if (!forceRefresh && providersCache && Date.now() - providersCacheTime < PROVIDERS_TTL) {
      return providersCache;
    }

    const result = await gambllyRequest('/game/providers.php?env=production');
    if (result.code !== 0 || !Array.isArray(result.data)) {
      throw new Error(`Gamblly providers API error: ${result.msg || 'Unknown'}`);
    }

    const providers: GameProvider[] = (result.data as Array<{ code: string; name: string; status?: number; lang?: string[] }>)
      .filter(p => !p.status || p.status === 1)
      .map(p => ({
        code: p.code,
        name: p.name,
        ko: !!(p.lang && p.lang.includes('ko')),
        total: 0,
        categories: {},
      }));

    providersCache = providers;
    providersCacheTime = Date.now();
    return providers;
  }

  async getGamesByProvider(providerCode: string, forceRefresh = false): Promise<Game[]> {
    const cached = gamesCache.get(providerCode);
    if (!forceRefresh && cached && Date.now() - cached.time < GAMES_TTL) {
      return cached.games;
    }

    const allRawGames: Array<{ game_uid: string; game_name: string; game_type?: string; img?: string; status?: number }> = [];
    let page = 1;
    const perPage = 100;

    // Fetch all pages
    while (true) {
      const result = await gambllyRequest(
        `/game/games.php?env=production&page=${page}&per_page=${perPage}&provider=${providerCode}`
      );
      if (result.code !== 0) {
        throw new Error(`Gamblly games API error: ${result.msg || 'Unknown'}`);
      }

      const rawGames = (Array.isArray(result.data) ? result.data : []) as Array<{
        game_uid: string;
        game_name: string;
        game_type?: string;
        img?: string;
        status?: number;
      }>;

      allRawGames.push(...rawGames);

      const total = result.total || 0;
      if (page * perPage >= total || rawGames.length < perPage) break;
      page++;
    }

    const providers = await this.getProviders();
    const provider = providers.find(p => p.code === providerCode);

    const games: Game[] = allRawGames.map(g => ({
      uid: g.game_uid,
      name: g.game_name,
      provider: providerCode,
      providerName: provider?.name || providerCode,
      type: g.game_type || 'Other',
      category: TYPE_CATEGORY_MAP[g.game_type || 'Other'] || 'other',
      image: g.img || undefined,
      ko: provider?.ko || false,
      status: g.status ?? 1,
    }));

    gamesCache.set(providerCode, { games, time: Date.now() });
    return games;
  }

  async getAllGames(forceRefresh = false): Promise<{ providers: GameProvider[]; games: Game[] }> {
    if (!forceRefresh && allGamesCache && Date.now() - allGamesCache.time < ALL_GAMES_TTL) {
      return { providers: allGamesCache.providers, games: allGamesCache.games };
    }

    // Stale-while-revalidate: return stale cache immediately, refresh in background
    if (!forceRefresh && allGamesCache && !allGamesRefreshing) {
      allGamesRefreshing = true;
      this._refreshAllGames().finally(() => { allGamesRefreshing = false; });
      return { providers: allGamesCache.providers, games: allGamesCache.games };
    }

    // Cold start or forced refresh — must wait
    return this._refreshAllGames();
  }

  private async _refreshAllGames(): Promise<{ providers: GameProvider[]; games: Game[] }> {
    const providers = await this.getProviders();
    const allGames: Game[] = [];
    const providerStats: GameProvider[] = [];

    // Batch requests (5 concurrent)
    const BATCH_SIZE = 5;
    for (let i = 0; i < providers.length; i += BATCH_SIZE) {
      const batch = providers.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map(async (p) => {
          const games = await this.getGamesByProvider(p.code);
          return { provider: p, games };
        })
      );

      for (const r of results) {
        if (r.status !== 'fulfilled') continue;
        const { provider, games } = r.value;
        if (!games.length) continue;

        const typeCounts: Record<string, number> = {};
        for (const g of games) {
          typeCounts[g.category] = (typeCounts[g.category] || 0) + 1;
        }

        const representativeImage = games.find(g => g.image)?.image;

        providerStats.push({
          ...provider,
          total: games.length,
          categories: typeCounts,
          image: representativeImage,
        });
        allGames.push(...games);
      }
    }

    providerStats.sort((a, b) => b.total - a.total);

    allGamesCache = { providers: providerStats, games: allGames, time: Date.now() };
    return { providers: providerStats, games: allGames };
  }

  /** Lightweight: returns providers with game counts from cache (no full game load) */
  async getProvidersWithStats(): Promise<GameProvider[]> {
    if (allGamesCache) {
      // Trigger background refresh if stale
      if (Date.now() - allGamesCache.time >= ALL_GAMES_TTL && !allGamesRefreshing) {
        allGamesRefreshing = true;
        this._refreshAllGames().finally(() => { allGamesRefreshing = false; });
      }
      return allGamesCache.providers;
    }
    // No cache yet — fetch all (first request)
    const result = await this.getAllGames();
    return result.providers;
  }

  async launchGame(params: {
    userId: number;
    gameUid: string;
    creditAmount?: number;
    platform?: 1 | 2;
  }): Promise<{ gameUrl: string; balance?: number }> {
    const timestamp = Date.now().toString();
    const transferId = `web_${timestamp}_${Math.random().toString(36).slice(2, 8)}`;
    const platformStr = params.platform === 2 ? 'mobile' : 'web';

    const result = await gambllyRequest('/v2/gameLaunch.php', 'POST', {
      agency_uid: apiKey,
      member_account: `u${params.userId}${playerPrefix}`,
      game_uid: params.gameUid,
      timestamp,
      credit_amount: String(params.creditAmount || 100),
      currency_code: 'INR',
      language: 'ko',
      platform: platformStr,
      home_url: homeUrl,
      transfer_id: transferId,
    });

    if (result.code !== 0) {
      throw new Error(`게임 런칭 실패: ${result.msg || 'Unknown error'}`);
    }

    const payload = result.payload as { game_launch_url?: string; after_amount?: number } | undefined;
    const gameUrl = payload?.game_launch_url;
    if (!gameUrl) {
      throw new Error('게임 URL을 받지 못했습니다');
    }

    return {
      gameUrl,
      balance: payload?.after_amount,
    };
  }

  getCategories() {
    return GAME_CATEGORIES;
  }
}
