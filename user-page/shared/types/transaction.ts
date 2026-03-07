export type CoinType = 'USDT' | 'TRX' | 'ETH' | 'BTC' | 'BNB';
export type NetworkType = 'TRC20' | 'ERC20' | 'BEP20' | 'BTC';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface WalletBalance {
  balance: string;
  points: string;
  bonusBalance: string;
}

export interface WalletAddress {
  id: number;
  coinType: CoinType;
  network: NetworkType;
  address: string;
  label?: string;
}

export interface DepositRequest {
  coinType: CoinType;
  network: NetworkType;
  amount: number;
  txHash?: string;
}

export interface WithdrawalRequest {
  coinType: CoinType;
  network: NetworkType;
  address: string;
  amount: string;
  password: string;
}

export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal';
  coinType: CoinType;
  network: NetworkType;
  amount: string;
  txHash?: string;
  status: TransactionStatus;
  createdAt: string;
  processedAt?: string;
}
