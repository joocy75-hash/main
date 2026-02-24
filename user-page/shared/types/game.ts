export type GameCategory = 'casino' | 'slot' | 'holdem' | 'sports' | 'shooting' | 'coin' | 'mini_game';

export interface GameProvider {
  id: number;
  code: string;
  name: string;
  logo?: string;
  category: GameCategory;
  gameCount: number;
  isActive: boolean;
}

export interface Game {
  id: number;
  externalId: string;
  name: string;
  provider: string;
  providerName: string;
  category: GameCategory;
  thumbnail?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface GameLaunchRequest {
  gameId: string;
  platform: 1 | 2; // 1=desktop, 2=mobile
}

export interface GameLaunchResponse {
  url: string;
  expiresIn: number;
}
