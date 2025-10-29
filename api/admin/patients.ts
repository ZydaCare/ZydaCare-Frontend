import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isActive: boolean;
  lastActive?: string;
  createdAt: string;
  healthProfile?: {
    bloodType?: string;
    height?: number;
    weight?: number;
  };
}

interface GetPatientsParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: 'active' | 'inactive';
}

export const getPatients = async (params: GetPatientsParams = {}) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/patients`, {
    params,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

export const getPatient = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/patients/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

export const activatePatient = async (id: string, reason?: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.patch(
    `${BASE_URL}/admin/patients/${id}/activate`,
    { reason },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data;
};

export const deactivatePatient = async (id: string, reason: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.patch(
    `${BASE_URL}/admin/patients/${id}/deactivate`,
    { reason },
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data;
};

export const getPatientAppointments = async (id: string, params: any = {}) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/patients/${id}/appointments`, {
    params,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};