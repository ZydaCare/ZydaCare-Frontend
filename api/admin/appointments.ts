import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileImage {
  url: string;
  public_id: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
}

export interface PatientInfo {
  contact: ContactInfo;
  fullName: string;
  dateOfBirth: string;
  age: number;
  gender?: string;
}

export interface MedicalContext {
  reasonForAppointment: string;
  currentSymptoms: string;
  medicalHistory: string;
  currentMedications: string;
  allergies: string;
  previousConsultations?: string;
  preferredDoctorOrSpecialty?: string;
  emergencyRedFlags: boolean;
  documents: any[];
}

export interface Declarations {
  isAccurate: boolean;
  consentToShare: boolean;
}

export interface DoctorProfile {
  profileImage: ProfileImage;
  title: string;
  professionalSummary?: string;
  specialties?: string[];
}

export interface Doctor {
  _id: string;
  fullName: string;
  email: string;
  speciality: string;
  profile: DoctorProfile;
}

export interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: ProfileImage;
}

export interface Appointment {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  patientInfo: PatientInfo;
  medicalContext: MedicalContext;
  declarations: Declarations;
  appointmentDate: string;
  appointmentType: 'in-person' | 'virtual' | 'home';
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'paid' | 'awaiting_payment';
  paymentStatus: 'pending' | 'success' | 'failed' | string;
  zydaCareCut: number;
  doctorEarning: number;
  splitType: 'auto' | 'manual' | null;
  reference?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface AppointmentsResponse {
  success: boolean;
  count: number;
  pagination: {
    next?: {
      page: number;
      limit: number;
    };
    prev?: {
      page: number;
      limit: number;
    };
  };
  data: Appointment[];
}

export interface AppointmentStats {
  total: number;
  totalRevenue: number;
  pending: number;
  confirmed: number;
  paid: number;
  cancelled: number;
  completionRate: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    count: number;
  }>;
}

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const getAppointments = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get<AppointmentsResponse>(`${BASE_URL}/admin/appointments`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
};

export const getAppointment = async (id: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get<{ success: boolean; data: Appointment }>(
      `${BASE_URL}/admin/appointments/${id}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching appointment ${id}:`, error);
    throw error;
  }
};

export const cancelAppointment = async (id: string, reason?: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.patch(
      `${BASE_URL}/admin/appointments/${id}/cancel`,
      { reason },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error cancelling appointment ${id}:`, error);
    throw error;
  }
};

export const completeAppointment = async (id: string, notes?: string) => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.patch(
      `${BASE_URL}/admin/appointments/${id}/complete`,
      { notes },
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error(`Error completing appointment ${id}:`, error);
    throw error;
  }
};

export const getAppointmentStats = async () => {
  try {
    const headers = await getAuthHeaders();
    const response = await axios.get<{ success: boolean; data: AppointmentStats }>(
      `${BASE_URL}/admin/appointments/stats`,
      { headers }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    throw error;
  }
};