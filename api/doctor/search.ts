import axios from 'axios';
import { BASE_URL } from '@/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ProfileImage {
    public_id: string;
    url: string;
}

export interface PatientSearchResult {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender?: string;
    dateOfBirth?: string;
    profileImage?: ProfileImage;
}

export interface AppointmentSearchResult {
    _id: string;
    appointmentDate: string;
    status: string;
    appointmentType: string;
    notes?: string;
    patient: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        profileImage?: ProfileImage;
    };
}

export interface SearchResponse<T> {
    success: boolean;
    count: number;
    data: T[];
    total?: number;
    pagination?: {
        next?: { page: number; limit: number };
        prev?: { page: number; limit: number };
    };
}

export const searchPatients = async (query: string): Promise<SearchResponse<PatientSearchResult>> => {
    const token = await AsyncStorage.getItem('token');
    try {
        const response = await axios.get<SearchResponse<PatientSearchResult>>(
            `${BASE_URL}/doctors/patients/search`,
            {
                params: { q: query },
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            }
        );
        console.log('patient search response', response.data);
        return response.data;
    } catch (error) {
        console.error('Error searching patients:', error);
        throw error;
    }
};

export const searchAppointments = async (
    query: string,
    status?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 10
): Promise<SearchResponse<AppointmentSearchResult>> => {
    const token = await AsyncStorage.getItem('token');
    try {
        const response = await axios.get<SearchResponse<AppointmentSearchResult>>(
            `${BASE_URL}/appointments/doctor/search`,
            {
                params: {
                    q: query,
                    status,
                    startDate,
                    endDate,
                    page,
                    limit
                },
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error searching appointments:', error);
        throw error;
    }
};
