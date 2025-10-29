import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface OverviewStats {
  counts: {
    totalUsers: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
  };
  recentTransactions: Array<{
    id: string;
    amount: number;
    status: 'completed' | 'pending' | 'failed';
    date: string;
    patientName: string;
  }>;
}

export interface UserAnalytics {
  growth: Array<{
    date: string;
    count: number;
  }>;
  total: number;
  activeUsers: number;
  newUsers: number;
}

export interface RevenueAnalytics {
  revenue: Array<{
    date: string;
    amount: number;
  }>;
  totalRevenue: number;
  changePercentage: number;
  topServices: Array<{
    name: string;
    revenue: number;
    percentage: number;
  }>;
}

export interface AppointmentAnalytics {
  status: {
    completed: number;
    pending: number;
    cancelled: number;
  };
  total: number;
  trend: Array<{
    date: string;
    count: number;
  }>;
  topDoctors: Array<{
    id: string;
    name: string;
    specialization: string;
    avatar: string | null;
    appointments: number;
  }>;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getOverviewAnalytics = async (): Promise<OverviewStats> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/analytics/overview`, { headers });
    return response.data?.data || response.data || defaultOverviewStats;
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    return defaultOverviewStats;
  }
};

export const getUserAnalytics = async (): Promise<UserAnalytics> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/analytics/users`, { headers });
    return response.data?.data || response.data || defaultUserAnalytics;
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return defaultUserAnalytics;
  }
};

export const getRevenueAnalytics = async (): Promise<RevenueAnalytics> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/analytics/revenue`, { headers });
    return response.data?.data || response.data || defaultRevenueAnalytics;
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    return defaultRevenueAnalytics;
  }
};

export const getAppointmentAnalytics = async (): Promise<AppointmentAnalytics> => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get(`${BASE_URL}/admin/analytics/appointments`, { headers });
    return response.data?.data || response.data || defaultAppointmentAnalytics;
  } catch (error) {
    console.error('Error fetching appointment analytics:', error);
    return defaultAppointmentAnalytics;
  }
};

export const getAllAnalytics = async () => {
  try {
    const [overview, users, revenue, appointments] = await Promise.all([
      getOverviewAnalytics(),
      getUserAnalytics(),
      getRevenueAnalytics(),
      getAppointmentAnalytics(),
    ]);
    return { overview, users, revenue, appointments };
  } catch (error) {
    console.error('Error fetching all analytics:', error);
    return {
      overview: defaultOverviewStats,
      users: defaultUserAnalytics,
      revenue: defaultRevenueAnalytics,
      appointments: defaultAppointmentAnalytics,
    };
  }
};

// Default values for when API calls fail
const defaultOverviewStats: OverviewStats = {
  counts: {
    totalUsers: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    totalRevenue: 0,
  },
  recentTransactions: [],
};

const defaultUserAnalytics: UserAnalytics = {
  growth: [],
  total: 0,
  activeUsers: 0,
  newUsers: 0,
};

const defaultRevenueAnalytics: RevenueAnalytics = {
  revenue: [],
  totalRevenue: 0,
  changePercentage: 0,
  topServices: [],
};

const defaultAppointmentAnalytics: AppointmentAnalytics = {
  status: {
    completed: 0,
    pending: 0,
    cancelled: 0,
  },
  total: 0,
  trend: [],
  topDoctors: [],
};