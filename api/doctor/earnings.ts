import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Transaction {
  _id: string;
  amount: number;
  doctorEarning: number;
  zydaCareCut: number;
  paymentStatus: 'success' | 'failed';
  reference: string;
  splitType: 'auto' | 'manual';
  createdAt: string;
  booking?: {
    _id: string;
    appointmentDate: string;
    status: string;
  };
  patient?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Withdrawal {
  _id: string;
  amount: number;
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  requestedAt: string;
  completedAt?: string;
}

export interface BankDetails {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}

export interface EarningsStats {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  withdrawnBalance: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  autoSplit: number;
  manualSplit: number;
}

export const getEarningsStats = async (): Promise<{ success: boolean; data: EarningsStats }> => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/payments/transactions?limit=1`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const getTransactions = async (page = 1, limit = 10) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(
    `${BASE_URL}/payments/transactions?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getTransaction = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/payments/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const getWithdrawals = async (page = 1, limit = 10) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(
    `${BASE_URL}/payments/withdrawals?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const getBanks = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/payments/banks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
};

export const addBankDetails = async (data: {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/payments/add-bank`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const resolveAccount = async (accountNumber: string, bankCode: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(
    `${BASE_URL}/payments/resolve-account?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};

export const requestWithdrawal = async (amount: number) => {
  const token = await AsyncStorage.getItem('token');
  const response = await fetch(`${BASE_URL}/payments/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ amount }),
  });
  return response.json();
};
