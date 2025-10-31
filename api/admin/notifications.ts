import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Notification {
  _id: string;
  title: string;
  message: string;
  recipientType: 'all' | 'patients' | 'doctors' | 'specific_user';
  recipient?: any;
  type: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledAt: string | Date;
  expiresAt?: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  readBy: Array<{
    user: string;
    readAt: string | Date;
  }>;
  data?: Record<string, any>;
  error?: string;
  sentAt?: string | Date;
  createdBy: string;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification | Notification[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface CreateNotificationData {
  title: string;
  message: string;
  recipientType: 'all' | 'patients' | 'doctors' | 'specific_user';
  recipient?: string;
  type?: string;
  data?: Record<string, any>;
  scheduledAt?: string | Date;
  expiresAt?: string | Date;
}

// Get all notifications
export const getNotifications = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  recipientType?: string;
}) => {
  const token = await AsyncStorage.getItem('token'); // ✅ Added await
  const response = await axios.get(`${BASE_URL}/admin/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    params,
    withCredentials: true,
  });
  return response.data;
};

// Get a single notification by ID
export const getNotificationById = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/notifications/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    withCredentials: true,
  });
  return response.data;
};

// Create a new notification
export const createNotification = async (data: CreateNotificationData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/admin/notifications`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// Send notification to all patients
export const notifyAllPatients = async (data: Omit<CreateNotificationData, 'recipientType'>) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/admin/notifications/patients`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// Send notification to a specific patient
export const notifyPatient = async (patientId: string, data: Omit<CreateNotificationData, 'recipientType' | 'recipient'>) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/admin/notifications/patients/${patientId}`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// Send notification to all doctors
export const notifyAllDoctors = async (data: Omit<CreateNotificationData, 'recipientType'>) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/admin/notifications/doctors`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// Send notification to a specific doctor
export const notifyDoctor = async (doctorId: string, data: Omit<CreateNotificationData, 'recipientType' | 'recipient'>) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(
    `${BASE_URL}/admin/notifications/doctors/${doctorId}`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      withCredentials: true,
    }
  );
  return response.data;
};

// Search for users (patients and doctors)
export interface SearchUserResult {
  id: string;
  userId?: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor';
  profileImage?: string;
  title?: string;
  specialization?: string;
  registrationNumber?: string;
  displayName: string;
}

export interface SearchUsersResponse {
  success: boolean;
  count: number;
  data: SearchUserResult[];
}

/**
 * Search for users (patients and doctors) by name, email, phone, or ID
 * @param query Search query (at least 2 characters)
 */
export const searchUsers = async (query: string): Promise<SearchUsersResponse> => {
  if (!query || query.length < 2) {
    throw new Error('Search query must be at least 2 characters long');
  }

  const token = await AsyncStorage.getItem('token');
  const response = await axios.get<SearchUsersResponse>(
    `${BASE_URL}/admin/notifications/search/users`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      params: { query },
      withCredentials: true,
    }
  );
  
  return response.data;
};