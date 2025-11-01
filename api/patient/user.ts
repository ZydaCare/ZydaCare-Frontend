import axios from 'axios';
import { BASE_URL } from '@/config';
import { User } from '@/types/User';

export interface DoctorApplicationStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedAt?: string;
  canApply?: boolean;
  canReapply?: boolean;
  isPending?: boolean;
  isApproved?: boolean;
  isRejected?: boolean;
  isDoctor?: boolean;
  message?: string;
  createdAt?: string;
}

/**
 * Get profile
 */
export const getProfile = async (token: string): Promise<User> => {
  const response = await axios.get(`${BASE_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data.data;
};

/**
 * Upload profile picture
 */
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

/**
 * Delete account
 */
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

/**
 * Get KYC status
 */
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

/**
 * Submit KYC documents
 */
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

export const shareProfile = async (token: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/auth/share-profile`,
      { shareProfile: true }, // Add the required field
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error sharing profile:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to share profile'
      };
    }
    return {
      success: false,
      message: error.message || 'Network error sharing profile'
    };
  }
};

/**
 * Apply to become a doctor
 */
export const applyToBecomeDoctor = async (formData: FormData, token: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/doctors/apply`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        // Increase timeout for large file uploads
        timeout: 120000, // 2 minutes
        // Track upload progress if needed
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          console.log(`Upload Progress: ${percentCompleted}%`);
          // You can call a callback here to update UI with progress
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handle specific error responses
      if (error.response) {
        // Server responded with error
        const errorMessage = error.response.data?.message || 'Failed to submit application';
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request made but no response
        throw new Error('No response from server. Please check your connection.');
      }
    }
    throw new Error('An unexpected error occurred. Please try again.');
  }
};


/**
 * Get doctor application status
 */
export const getDoctorApplicationStatus = async (token: string): Promise<DoctorApplicationStatus> => {
  try {
    const response = await axios.get(`${BASE_URL}/doctors/application-status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to fetch application status');
    }
    throw new Error('An unexpected error occurred');
  }
};

/**
 * Get all approved doctors (for patients)
 */
export const getAllDoctors = async (token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/doctors`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch doctors' };
  }
};

/**
 * Get doctor details by ID (for patients)
 */
export const getDoctorDetails = async (doctorId: string, token: string) => {
  try {
    const response = await axios.get(`${BASE_URL}/auth/doctors/${doctorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Failed to fetch doctor details' };
  }
};
