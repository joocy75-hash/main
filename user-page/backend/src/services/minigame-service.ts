import type { Redis } from 'ioredis';

interface PowerBall {
  pOddEven: number;
  pUnderOver: number;
  nOddEven: number;
  nUnderOver: number;
  nSML: number;
  nBall1: number;
  nBall2: number;
  nBall3: number;
  nBall4: number;
  nBall5: number;
  nBallSum: number;
  nBallType: string;
  pBall: number;
  pBallType: string;
}

interface PowerLadder {
  leftRight: number;
  ladderCount: number;
  oddEven: number;
  plType: number;
}

interface BepickRound {
  ID: number;
  Date: string;
  Round: number;
  AllRound: number;
  PowerBall: PowerBall;
  PowerLadder: PowerLadder;
  BlockInfo?: Record<string, unknown>;
}

interface MinigameType {
  code: string;
  name: string;
  description: string;
  interval: string;
  markets: { code: string; name: string; options: string[] }[];
}

const CACHE_KEY = 'minigame:bepick:rounds';
const CACHE_TTL = 10;
const BEPICK_API_URL = 'https://api.bepick.io/eth/get/';
const FETCH_TIMEOUT = 5000;

const GAME_TYPES: MinigameType[] = [
  {
    code: 'powerball',
    name: 'EOS 파워볼',
    description: '5분 간격, 하루 288회차',
    interval: '5분',
    markets: [
      { code: 'pb_odd_even', name: '파워볼 홀짝', options: ['홀', '짝'] },
      { code: 'pb_under_over', name: '파워볼 언오버', options: ['언더(0-4)', '오버(5-9)'] },
      { code: 'nb_odd_even', name: '일반볼 홀짝', options: ['홀', '짝'] },
      { code: 'nb_under_over', name: '일반볼 언오버', options: ['언더', '오버'] },
      { code: 'nb_size', name: '일반볼 대중소', options: ['소(15-64)', '중(65-80)', '대(81-130)'] },
    ],
  },
  {
    code: 'powerladder',
    name: 'EOS 파워사다리',
    description: '5분 간격, 하루 288회차',
    interval: '5분',
    markets: [
      { code: 'pl_left_right', name: '출발', options: ['좌출발', '우출발'] },
      { code: 'pl_lines', name: '줄수', options: ['3줄', '4줄'] },
      { code: 'pl_odd_even', name: '홀짝', options: ['홀', '짝'] },
    ],
  },
];

export class BepickService {
  async getLatestRounds(redis: Redis): Promise<BepickRound[]> {
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }

    const rounds = await this.fetchFromBepick();
    if (rounds.length > 0) {
      await redis.set(CACHE_KEY, JSON.stringify(rounds), 'EX', CACHE_TTL);
    }
    return rounds;
  }

  async getCurrentRound(redis: Redis): Promise<BepickRound | null> {
    const rounds = await this.getLatestRounds(redis);
    return rounds.length > 0 ? rounds[0] : null;
  }

  getGameTypes(): MinigameType[] {
    return GAME_TYPES;
  }

  private async fetchFromBepick(): Promise<BepickRound[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

      const response = await fetch(BEPICK_API_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data: unknown = await response.json();

      if (Array.isArray(data)) {
        return data as BepickRound[];
      }

      if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as Record<string, unknown>).data)) {
        return (data as Record<string, unknown>).data as BepickRound[];
      }

      return [];
    } catch {
      return [];
    }
  }
}
