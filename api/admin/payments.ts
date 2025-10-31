import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Transaction {
  _id: string;
  amount: number;
  paymentStatus: string;
  reference: string;
  createdAt: string;
  patient: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  doctor: {
    fullName: string;
    specialty: string;
    profile: {
      title: string;
    };
  };
  booking?: {
    appointmentDate: string;
    status: string;
    amount: number;
  };
}

interface RevenueSummary {
  totalRevenue: number;
  totalTransactions: number;
  byStatus: {
    [key: string]: {
      count: number;
      totalAmount: number;
    };
  };
  recentTransactions: Transaction[];
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/payments`, { headers });
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const getTransaction = async (id: string): Promise<Transaction | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/payments/${id}`, { headers });
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};

export const getRevenueSummary = async (): Promise<RevenueSummary | null> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/payments/revenue/summary`, { headers });
    return response.data?.data || null;
  } catch (error) {
    console.error('Error fetching revenue summary:', error);
    // Return default values to prevent UI from breaking
    return {
      totalRevenue: 0,
      totalTransactions: 0,
      byStatus: {},
      recentTransactions: []
    };
  }
};
