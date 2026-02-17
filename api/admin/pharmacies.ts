import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Pharmacy {
  _id: string;
  pharmacyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  pharmacyType: 'Community Pharmacy' | 'Hospital Pharmacy' | 'Retail Pharmacy Chain' | 'Independent Pharmacy' | 'Clinical Pharmacy' | 'Compounding Pharmacy' | 'Wholesale Pharmacy';
  inviteCode: string;
  inviteLink: string;
  status: 'invited' | 'onboarding' | 'onboarded' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  licenseNumber?: string;
  licenseExpiry?: string;
  operatingHours?: {
    monday: { open?: string; close?: string; closed?: boolean };
    tuesday: { open?: string; close?: string; closed?: boolean };
    wednesday: { open?: string; close?: string; closed?: boolean };
    thursday: { open?: string; close?: string; closed?: boolean };
    friday: { open?: string; close?: string; closed?: boolean };
    saturday: { open?: string; close?: string; closed?: boolean };
    sunday: { open?: string; close?: string; closed?: boolean };
  };
  userId?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  inviteEmailSent?: boolean;
  inviteEmailSentAt?: string;
  lastReminderSentAt?: string;
  reminderCount?: number;
  
  // Comprehensive onboarding fields
  pcnRegistrationNumber?: string;
  yearOfRegistration?: number;
  googleMapLocation?: string;
  pcnCertificate?: string;
  premisesLicense?: string;
  superintendentPharmacistName?: string;
  pharmacistPcnNumber?: string;
  pharmacistPhone?: string;
  pharmacistEmail?: string;
  pharmacistLicense?: string;
  pharmacistValidId?: string;
  deliveryRadius?: number;
  emergencyAvailability?: boolean;
  supportedDrugCategories?: string[];
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  settlementPreference?: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  agreements?: {
    validPrescriptions?: boolean;
    noCounterfeitDrugs?: boolean;
    acceptAudits?: boolean;
    followDeliverySOP?: boolean;
  };
  digitalSignature?: string;
  rejectionReason?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isExpired?: boolean;
  daysUntilExpiry?: number;
}

export interface PharmacyInviteData {
  pharmacyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  pharmacyType: 'Community Pharmacy' | 'Hospital Pharmacy' | 'Retail Pharmacy Chain' | 'Independent Pharmacy' | 'Clinical Pharmacy' | 'Compounding Pharmacy' | 'Wholesale Pharmacy';
}

export interface PharmacyStats {
  total: number;
  invited: number;
  onboarding: number;
  onboarded: number;
  approved: number;
  rejected: number;
  expired: number;
  expiringSoon: number;
}

interface GetPharmaciesParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: 'invited' | 'onboarding' | 'onboarded' | 'approved' | 'rejected' | 'expired';
  type?: 'Community Pharmacy' | 'Hospital Pharmacy' | 'Retail Pharmacy Chain' | 'Independent Pharmacy' | 'Clinical Pharmacy' | 'Compounding Pharmacy' | 'Wholesale Pharmacy';
}

// Get all pharmacies with optional filtering and pagination
export const getPharmacies = async (params: GetPharmaciesParams = {}) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/pharmacies`, {
    params,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Get single pharmacy by ID
export const getPharmacy = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/pharmacies/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

// Create pharmacy invite
export const createPharmacyInvite = async (data: PharmacyInviteData) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(`${BASE_URL}/admin/pharmacies/invite`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Update pharmacy information
export const updatePharmacy = async (id: string, data: Partial<Pharmacy>) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}/admin/pharmacies/${id}`, data, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

// Delete/Deactivate pharmacy
export const deletePharmacy = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.delete(`${BASE_URL}/admin/pharmacies/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Approve pharmacy
export const approvePharmacy = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}/admin/pharmacies/${id}/approve`, {}, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

// Reject pharmacy
export const rejectPharmacy = async (id: string, reason?: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}/admin/pharmacies/${id}/reject`, 
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

// Resend pharmacy invite
export const resendPharmacyInvite = async (id: string) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.post(`${BASE_URL}/admin/pharmacies/${id}/resend-invite`, {}, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data;
};

// Extend pharmacy invite
export const extendPharmacyInvite = async (id: string, days: number = 7) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.put(`${BASE_URL}/admin/pharmacies/${id}/extend-invite`, 
    { days }, 
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

// Get pharmacy statistics
export const getPharmacyStats = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/pharmacies/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

// Get expired invites
export const getExpiredInvites = async () => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/pharmacies/expired`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};

// Get invites expiring soon
export const getExpiringSoonInvites = async (days: number = 2) => {
  const token = await AsyncStorage.getItem('token');
  const response = await axios.get(`${BASE_URL}/admin/pharmacies/expiring-soon`, {
    params: { days },
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return response.data.data;
};
