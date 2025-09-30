import axios from 'axios';
import { BASE_URL } from '@/config';
import { User } from '@/types/User';

export const getProfile = async (token: string): Promise<User> => {
  const response = await axios.get(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

export const uploadProfilePicture = async (token: string, uri: string, type: string): Promise<User> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'profile.jpg',
    type,
  } as any);

  const response = await axios.put(
    `${BASE_URL}/auth/upload-picture`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
};

export const deleteAccount = async (token: string): Promise<{ success: boolean; message: string }> => {
  const response = await axios.delete(`${BASE_URL}/auth/delete-account`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
