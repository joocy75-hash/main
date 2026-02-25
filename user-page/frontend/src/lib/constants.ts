export const COINS = [
  { type: 'USDT', name: 'USDT', network: 'TRC20', icon: '💲' },
  { type: 'TRX', name: 'TRX', network: 'TRC20', icon: '🔷' },
  { type: 'ETH', name: 'ETH', network: 'ERC20', icon: '⟠' },
  { type: 'BTC', name: 'BTC', network: 'BTC', icon: '₿' },
  { type: 'BNB', name: 'BNB', network: 'BEP20', icon: '🟡' },
] as const;

export const GAME_CATEGORIES = [
  { code: 'casino', name: '카지노', icon: '🎰' },
  { code: 'slot', name: '슬롯', icon: '🎲' },
  { code: 'holdem', name: '홀덤', icon: '🃏' },
  { code: 'sports', name: '스포츠', icon: '⚽' },
  { code: 'esports', name: 'e스포츠', icon: '🎮' },
  { code: 'shooting', name: '슈팅', icon: '🎯' },
  { code: 'coin', name: '코인', icon: '🪙' },
  { code: 'mini_game', name: '미니게임', icon: '🎮' },
] as const;

export const DEFAULT_NETWORK: Record<string, string> = {
  USDT: 'TRC20',
  TRX: 'TRC20',
  ETH: 'ERC20',
  BTC: 'BTC',
  BNB: 'BEP20',
};
