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

export const ADDRESS_PATTERNS: Record<string, { regex: RegExp; example: string }> = {
  'TRC20': { regex: /^T[1-9A-HJ-NP-Za-km-z]{33}$/, example: 'T...' },
  'ERC20': { regex: /^0x[0-9a-fA-F]{40}$/, example: '0x...' },
  'BEP20': { regex: /^0x[0-9a-fA-F]{40}$/, example: '0x...' },
  'BTC':   { regex: /^(1[1-9A-HJ-NP-Za-km-z]{25,34}|3[1-9A-HJ-NP-Za-km-z]{25,34}|bc1[0-9a-z]{25,90})$/, example: '1... / 3... / bc1...' },
};

export function validateAddress(network: string, address: string): { valid: boolean; message?: string } {
  const pattern = ADDRESS_PATTERNS[network];
  if (!pattern) return { valid: true };
  if (!pattern.regex.test(address)) {
    return { valid: false, message: `${network} 주소 형식이 올바르지 않습니다. 예: ${pattern.example}` };
  }
  return { valid: true };
}
