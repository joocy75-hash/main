import { create } from 'zustand';
import { api } from '@/lib/api-client';

export interface WalletAddress {
  id: number;
  coinType: string;
  network: string;
  address: string;
  label?: string;
}

export interface Deposit {
  id: number;
  coinType: string;
  network: string;
  amount: string;
  depositAddress?: string;
  txHash?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Withdrawal {
  id: number;
  coinType: string;
  network: string;
  address: string;
  amount: string;
  fee: string;
  netAmount: string;
  txHash?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Transaction {
  id: number;
  type: 'deposit' | 'withdrawal';
  coinType: string;
  network: string;
  amount: string;
  txHash?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface BalanceResponse {
  balance: string;
  points: string;
  bonusBalance: string;
}

interface TransactionsResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

interface TransactionFilters {
  type?: 'deposit' | 'withdrawal';
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

interface WalletState {
  balance: string;
  points: string;
  bonusBalance: string;
  addresses: WalletAddress[];
  deposits: Deposit[];
  withdrawals: Withdrawal[];
  transactions: Transaction[];
  transactionsTotal: number;
  transactionsPage: number;
  transactionsHasMore: boolean;
  isLoading: boolean;

  fetchBalance: () => Promise<void>;
  fetchAddresses: () => Promise<void>;
  addAddress: (coinType: string, network: string, address: string, label?: string) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  createDeposit: (coinType: string, network: string, amount: number) => Promise<void>;
  createWithdrawal: (coinType: string, network: string, address: string, amount: number, password: string) => Promise<void>;
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  fetchDeposits: () => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balance: '0',
  points: '0',
  bonusBalance: '0',
  addresses: [],
  deposits: [],
  withdrawals: [],
  transactions: [],
  transactionsTotal: 0,
  transactionsPage: 1,
  transactionsHasMore: false,
  isLoading: false,

  fetchBalance: async () => {
    try {
      const data = await api.get<BalanceResponse>('/api/wallet/balance');
      set({
        balance: data.balance,
        points: data.points,
        bonusBalance: data.bonusBalance,
      });
    } catch {
      // Ignore balance fetch errors
    }
  },

  fetchAddresses: async () => {
    try {
      const data = await api.get<WalletAddress[]>('/api/wallet/addresses');
      set({ addresses: data });
    } catch {
      set({ addresses: [] });
    }
  },

  addAddress: async (coinType, network, address, label) => {
    await api.post('/api/wallet/addresses', { coinType, network, address, label });
    const data = await api.get<WalletAddress[]>('/api/wallet/addresses');
    set({ addresses: data });
  },

  deleteAddress: async (id) => {
    await api.delete(`/api/wallet/addresses/${id}`);
    set((state) => ({
      addresses: state.addresses.filter((a) => a.id !== id),
    }));
  },

  createDeposit: async (coinType, network, amount) => {
    await api.post('/api/wallet/deposit', { coinType, network, amount });
  },

  createWithdrawal: async (coinType, network, address, amount, password) => {
    await api.post('/api/wallet/withdraw', { coinType, network, address, amount, password });
  },

  fetchTransactions: async (filters) => {
    set({ isLoading: true });
    try {
      const params: Record<string, string> = {};
      if (filters?.type) params.type = filters.type;
      if (filters?.status) params.status = filters.status;
      if (filters?.page) params.page = String(filters.page);
      if (filters?.limit) params.limit = String(filters.limit);

      const data = await api.get<TransactionsResponse>('/api/wallet/transactions', params);
      set({
        transactions: data.data,
        transactionsTotal: data.total,
        transactionsPage: data.page,
        transactionsHasMore: data.hasMore,
        isLoading: false,
      });
    } catch {
      set({ transactions: [], isLoading: false });
    }
  },

  fetchDeposits: async () => {
    try {
      const data = await api.get<TransactionsResponse>('/api/wallet/transactions', {
        type: 'deposit',
        limit: '5',
      });
      set({ deposits: data.data as unknown as Deposit[] });
    } catch {
      set({ deposits: [] });
    }
  },

  fetchWithdrawals: async () => {
    try {
      const data = await api.get<TransactionsResponse>('/api/wallet/transactions', {
        type: 'withdrawal',
        limit: '5',
      });
      set({ withdrawals: data.data as unknown as Withdrawal[] });
    } catch {
      set({ withdrawals: [] });
    }
  },
}));
