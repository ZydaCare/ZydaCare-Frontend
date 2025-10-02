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

export interface KYCStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
}

export const getKYCStatus = async (token: string): Promise<KYCStatus> => {
  const response = await axios.get(`${BASE_URL}/auth/kyc/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

interface FileType {
  uri: string;
  name?: string;
  type?: string;
}

interface SubmitKYCResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export const submitKYCDocuments = async (
  token: string,
  documentType: string,
  documentNumber: string,
  documentImage: { uri: string },
  selfieImage: { uri: string },
  proofOfAddress: { uri: string }
): Promise<SubmitKYCResponse> => {
  try {
    const formData = new FormData();
    
    // Add text fields
    formData.append('documentType', documentType);
    formData.append('documentNumber', documentNumber);
    
    // Helper function to create a file object from URI
    const createFileFromUri = async (uri: string, name: string, type: string) => {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = uri.split('/').pop() || `file-${Date.now()}.jpg`;
      return {
        uri,
        name: fileName,
        type: type || 'image/jpeg',
      };
    };

    // Create file objects
    const docFile = await createFileFromUri(documentImage.uri, 'documentImage', 'image/jpeg');
    const selfieFile = await createFileFromUri(selfieImage.uri, 'selfieImage', 'image/jpeg');
    const poaFile = await createFileFromUri(proofOfAddress.uri, 'proofOfAddress', 'image/jpeg');
    
    // Append files to form data using React Native's FormData API
    formData.append('documentImage', {
      uri: docFile.uri,
      name: docFile.name,
      type: docFile.type,
    } as any);
    
    formData.append('selfieImage', {
      uri: selfieFile.uri,
      name: selfieFile.name,
      type: selfieFile.type,
    } as any);
    
    formData.append('proofOfAddress', {
      uri: poaFile.uri,
      name: poaFile.name,
      type: poaFile.type,
    } as any);
    
    // Make the request
    const response = await fetch(`${BASE_URL}/auth/kyc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData as any,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to submit KYC documents');
    }

    return { 
      success: true, 
      message: data.message || 'KYC submitted successfully',
      data: data.data
    };
  } catch (error: any) {
    console.error('Error submitting KYC documents:', error);
    return { 
      success: false, 
      message: error.message || 'Failed to submit KYC documents'
    };
  }
};