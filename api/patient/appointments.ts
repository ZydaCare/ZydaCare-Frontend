import axios from 'axios';
import { BASE_URL } from '@/config';

export type AppointmentType = 'in-person' | 'home' | 'virtual';

export interface CreateBookingPayload {
    doctorId: string;
    appointmentDate: string; // ISO string
    appointmentType: AppointmentType;
    // Patient info
    fullName: string;
    dateOfBirth?: string; // ISO
    age?: number;
    gender?: 'Male' | 'Female' | 'Other';
    contactPhone?: string;
    contactEmail?: string;
    // Medical context
    reasonForAppointment?: string;
    currentSymptoms?: string;
    medicalHistory?: string;
    currentMedications?: string;
    allergies?: string;
    previousConsultations?: string;
    preferredDoctorOrSpecialty?: string;
    emergencyRedFlags?: boolean;
    // Declarations
    isAccurate: boolean;
    consentToShare: boolean;
    // Payment
    amount: number; // NGN
}

export const createBooking = async (token: string, payload: CreateBookingPayload) => {
    const response = await axios.post(
        `${BASE_URL}/appointments/book`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const initiateAppointmentPayment = async (token: string, bookingId: string) => {
    const response = await axios.post(
        `${BASE_URL}/appointments/payment/initiate`,
        { bookingId },
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
};

export const verifyAppointmentPayment = async (reference: string) => {
    const response = await axios.post(
        `${BASE_URL}/appointments/payment/webhook`,
        { reference },
    );
    return response.data;
};

export const checkPaymentStatus = async (reference: string, token: string) => {
    const response = await fetch(`${BASE_URL}/appointments/payment/status/${reference}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });
    // if (!response.ok) {
    //     throw new Error('Failed to check payment status');
    // }
    return response.json();
}


// Get current patient's appointments
export const getMyAppointments = async (token: string) => {
    const response = await axios.get(`${BASE_URL}/appointments/mine`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

// Get details of a specific appointment
export const getAppointmentDetails = async (token: string, id: string) => {
    const response = await axios.get(`${BASE_URL}/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};
