import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '@/config';

// Types
export interface AppointmentStats {
    todayAppointments: number;
    totalPatients: number;
    stats: {
        paid?: { count: number; totalFees: number };
        confirmed?: { count: number; totalFees: number };
        completed?: { count: number; totalFees: number };
        totalCancelledBookings?: { count: number; totalFees: number };
        pending?: { count: number; totalFees: number };
    };
}

export interface Appointment {
    _id: string;
    patientInfo: {
        fullName: string;
        contact: {
            phone: string;
            email: string;
        };
        dateOfBirth: string;
        age: number;
        gender: string;
    };
    medicalContext: {
        reasonForAppointment: string;
        currentSymptoms: string;
        medicalHistory: string;
        currentMedications: string;
        allergies: string;
        emergencyRedFlags: boolean;
    };
    patient: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profileImage?: {
            url: string;
        };
        age: number;
        gender?: string;
    };
    doctor: any;
    appointmentDate: string;
    appointmentType: 'virtual' | 'in-person' | 'home-visit';
    amount: number;
    status: 'pending' | 'accepted' | 'awaiting_payment' | 'paid' | 'cancelled';
    paymentStatus: string;
    reference?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Patient {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dob: string;
    profileImage?: {
        url: string;
    };
    age: number;
    gender?: string;
    shareProfile: boolean;
    healthProfile?: {
        bloodPressure?: any;
        bmi?: any;
        height?: any;
        weight?: any;
        conditions?: any[];
    };
    medicalHistory?: any[];
    totalAppointments: number;
    lastAppointment: string | null;
}

export interface PatientDetails extends Patient {
    address?: string;
    appointments: {
        total: number;
        list: Array<{
            _id: string;
            appointmentDate: string;
            status: string;
        }>;
    };
    stats: {
        [key: string]: {
            count: number;
            totalFees: number;
        };
    };
}

// API Functions
// Get appointment statistics
export const getAppointmentStats = async (): Promise<{ success: boolean; data: AppointmentStats }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/appointments/doctor/stats`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch appointment stats');
    }

    return response.json();
};

// Get all appointments for doctor
export const getDoctorAppointments = async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<{ success: boolean; count: number; data: Appointment[] }> => {
    const token = await AsyncStorage.getItem('token');

    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    const url = `${BASE_URL}/appointments/doctor${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch appointments');
    }

    return response.json();
};

// Get specific appointment details
export const getAppointment = async (id: string): Promise<{ success: boolean; data: Appointment }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/appointments/doctor/${id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch appointment details');
    }

    return response.json();
};

// Accept an appointment
export const acceptAppointment = async (id: string): Promise<{ success: boolean; message: string }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/appointments/${id}/accept`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to accept appointment');
    }

    return response.json();
};

// Complete an appointment
export const completeAppointment = async (id: string): Promise<{ success: boolean; message: string }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/appointments/${id}/complete`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to complete appointment');
    }

    return response.json();
};

// Cancel an appointment
export const cancelAppointment = async (id: string): Promise<{ success: boolean; message: string }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/appointments/${id}/cancel`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to cancel appointment');
    }

    return response.json();
};

// Get all patients
export const getDoctorPatients = async (): Promise<{ success: boolean; count: number; data: Patient[] }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/doctors/patients`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch patients');
    }

    return response.json();
};

// Get specific patient details
export const getPatientDetails = async (id: string): Promise<{ success: boolean; data: PatientDetails }> => {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/doctors/patients/${id}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch patient details');
    }

    return response.json();
};