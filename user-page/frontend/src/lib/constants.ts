export const COINS = [
  { type: 'USDT', name: 'USDT', network: 'TRC20', icon: '💲', iconUrl: '/images/currency/USDT.webp' },
  { type: 'TRX', name: 'TRX', network: 'TRC20', icon: '🔷', iconUrl: '/images/currency/TRX.png' },
  { type: 'ETH', name: 'ETH', network: 'ERC20', icon: '⟠', iconUrl: '/images/currency/ETH.webp' },
  { type: 'BTC', name: 'BTC', network: 'BTC', icon: '₿', iconUrl: '/images/currency/MBTC.webp' },
  { type: 'BNB', name: 'BNB', network: 'BEP20', icon: '🟡', iconUrl: '/images/currency/BNB.png' },
] as const;

export const DEFAULT_NETWORK: Record<string, string> = {
  USDT: 'TRC20',
  TRX: 'TRC20',
  ETH: 'ERC20',
  BTC: 'BTC',
  BNB: 'BEP20',
};
