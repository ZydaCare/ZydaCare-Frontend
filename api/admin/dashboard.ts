import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DashboardStats {
  doctors: number;
  patients: number;
  bookings: number;
  revenue: number;
  earnings: number;
  registrations: {
    today: number;
    thisWeek: number;
  };
  monthlyActiveUsers: number;
  bookingStatus: Record<string, number>;
}

export const getDashboardOverview = async (): Promise<DashboardStats> => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await axios.get(`${BASE_URL}/admin/overview`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
        
    // Handle different response structures
    if (response.data && response.data.data) {
      return response.data.data; // If data is nested under 'data' property
    }
    
    if (response.data && typeof response.data === 'object') {
      return response.data; // If data is directly in response
    }
    
    return defaultDashboardStats;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

const defaultDashboardStats: DashboardStats = {
  doctors: 0,
  patients: 0,
  bookings: 0,
  revenue: 0,
  earnings: 0,
  registrations: {
    today: 0,
    thisWeek: 0,
  },
  monthlyActiveUsers: 0,
  bookingStatus: {}
};

export const getDashboardCharts = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/overview/charts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};