import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  specialty: string;
  status: string;
  isActive: boolean;
  createdAt: string;
}

interface GetDoctorsParams {
  page?: number;
  limit?: number;
  sort?: string;
  status?: string;
  search?: string;
}

export const getDoctors = async (params: GetDoctorsParams = {}) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/doctors`, {
    params,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

export const getDoctor = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/doctors/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

export const approveDoctor = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.patch(
    `${BASE_URL}/admin/doctors/${id}/approve`,
    {},
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.data;
};

export const rejectDoctor = async (id: string, reason: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.patch(
    `${BASE_URL}/admin/doctors/${id}/reject`,
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

export const suspendDoctor = async (id: string, reason?: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.patch(
    `${BASE_URL}/admin/doctors/${id}/suspend`,
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

export const deleteDoctor = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.delete(`${BASE_URL}/admin/doctors/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};