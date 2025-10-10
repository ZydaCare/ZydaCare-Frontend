import { BASE_URL } from '@/config';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';


export interface MedicalHistoryItem {
  _id: string;
  condition: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  date: string | Date;
  category: 'acute' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalHistoryResponse {
  success: boolean;
  data: MedicalHistoryItem | MedicalHistoryItem[];
  count?: number;
  stats?: {
    total: number;
    chronic: number;
    acute: number;
  };
  message?: string;
}

interface GetMedicalHistoryParams {
  category?: 'all' | 'acute' | 'chronic';
  search?: string;
}

export const getMedicalHistory = async (params?: GetMedicalHistoryParams, token?: string): Promise<MedicalHistoryResponse> => {
  try {
    // const token = localStorage.getItem('token');
    const queryParams = new URLSearchParams();
    
    if (params?.category && params.category !== 'all') {
      queryParams.append('category', params.category);
    }
    
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const response = await fetch(`${BASE_URL}/medical-history?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medical history');
    }

    return {
      success: true,
      data: data.data || [],
      count: data.count,
      stats: data.stats,
    };
  } catch (error) {
    console.error('Error in getMedicalHistory:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch medical history',
      data: [],
    };
  }
};

export const getMedicalRecord = async (id: string, token?: string): Promise<MedicalHistoryResponse> => {
  try {
    // const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch medical record');
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error in getMedicalRecord:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch medical record',
      data: []
    };
  }
};

export const uploadImage = async (uri: string, token?: string): Promise<string> => {
  try {
    console.log('Processing image URI:', uri);
    console.log('Platform:', Platform.OS);
    
    // For React Native, we need to read the file differently
    if (Platform.OS !== 'web') {
      // Use the legacy API directly
      const base64 = await readAsStringAsync(uri, {
        encoding: 'base64',
      });
      
      console.log('Base64 length:', base64.length);
      
      // Determine the image type from the URI
      const imageType = uri.match(/\.(jpg|jpeg|png|gif)$/i)?.[1] || 'jpeg';
      const mimeType = `image/${imageType === 'jpg' ? 'jpeg' : imageType}`;
      
      // Return as data URI
      return `data:${mimeType};base64,${base64}`;
    } else {
      // For web platform, use fetch and FileReader
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          resolve(base64data);
        };
        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          reject(new Error('Failed to read image file'));
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw the original error with its message
    }
    throw new Error('Failed to process image. Please try again.');
  }
};

export const addMedicalRecord = async(token: string, recordData: Omit<MedicalHistoryItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<MedicalHistoryResponse> => {
  try {
    // const token = await localStorage.getItem('token');
    
    // Handle image uploads if there are any
    let imageUrls: string[] = [];
    if (recordData.images && recordData.images.length > 0) {
      const uploadPromises = recordData.images.map(uri => uploadImage(uri));
      imageUrls = await Promise.all(uploadPromises);
    }
    
    const response = await fetch(`${BASE_URL}/medical-history`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...recordData,
        images: imageUrls,
        date: new Date(recordData.date).toISOString(),
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add medical record');
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error in addMedicalRecord:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to add medical record',
      data: [],
    };
  }
};

export const updateMedicalRecord = async (id: string, token: string, updates: Partial<MedicalHistoryItem>): Promise<MedicalHistoryResponse> => {
  try {
    // const token = localStorage.getItem('token');
    
    // Handle image uploads if there are any
    let imageUrls: string[] = [];
    if (updates.images && updates.images.length > 0) {
      const uploadPromises = updates.images.map(uri => uploadImage(uri));
      imageUrls = await Promise.all(uploadPromises);
    }
    const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...updates,
        ...(updates.date ? { date: new Date(updates.date).toISOString() } : {}),
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update medical record');
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('Error in updateMedicalRecord:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update medical record',
      data: []
    };
  }
};

export const deleteMedicalRecord = async (id: string, token: string): Promise<{ success: boolean; message?: string }> => {
  try {
    // const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/medical-history/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete medical record');
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error in deleteMedicalRecord:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete medical record',
    };
  }
};
