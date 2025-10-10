import axios from 'axios';
import { BASE_URL } from '@/config';

// Types
export interface HealthMetrics {
  temperature?: { value: number; unit: 'C' | 'F' };
  bloodPressure?: { systolic: number; diastolic: number };
  pulseRate?: number;
  bloodOxygen?: number;
  height?: { value: number; unit: 'cm' | 'ft' };
  weight?: { value: number; unit: 'kg' | 'lb' };
  bmi?: { value: number; category: string };
  visualAcuity?: { leftEye: string; rightEye: string };
}

export interface Condition {
  name: string;
  diagnosisDate?: Date;
  severity?: 'mild' | 'moderate' | 'severe';
  isActive?: boolean;
  notes?: string;
}

export interface Medication {
  _id?: string;
  drugName: string;
  dosage: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'as_needed';
  time: string;
  timesPerDay?: string[];
  specificDays?: string[];
  notes: string;
  enabled: boolean;
  nextReminder?: Date;
  lastTaken?: Date;
}

export interface NotificationPreferences {
  medicationReminders: {
    enabled: boolean;
    sound: string;
    advanceNotice: {
      value: number;
      unit: 'minutes' | 'hours';
    };
  };
  healthAlerts: {
    enabled: boolean;
  };
}

// Health Profile APIs
export const healthProfileApi = {
  // Get health profile
  getHealthProfile: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/health-profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Update health metrics
  updateHealthMetrics: async (token: string, metrics: Partial<HealthMetrics>) => {
    const response = await axios.put(`${BASE_URL}/health-profile`, metrics, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Update notification preferences
  updateNotificationPreferences: async (token: string, preferences: NotificationPreferences) => {
    const response = await axios.put(
      `${BASE_URL}/health-profile/notification-preferences`,
      preferences,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  }
};

// Conditions APIs
export const conditionsApi = {
  // Get all conditions
  getConditions: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/health-profile/conditions`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Add or update condition
  addCondition: async (token: string, condition: Partial<Condition>) => {
    const response = await axios.post(
      `${BASE_URL}/health-profile/conditions`,
      condition,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },

  // Remove condition
  removeCondition: async (token: string, conditionName: string) => {
    const response = await axios.delete(
      `${BASE_URL}/health-profile/conditions/${encodeURIComponent(conditionName)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  }
};

// Medications APIs
export const medicationsApi = {
  // Get all medications
  getMedications: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/medications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Get upcoming reminders
  getUpcomingReminders: async (token: string) => {
    const response = await axios.get(`${BASE_URL}/medications/upcoming`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Add medication
  addMedication: async (token: string, medication: Partial<Medication>) => {
    const response = await axios.post(`${BASE_URL}/medications`, medication, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
  },

  // Update medication
  updateMedication: async (token: string, medicationId: string, updates: Partial<Medication>) => {
    const response = await axios.put(
      `${BASE_URL}/medications/${medicationId}`,
      updates,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  },

  // Delete medication
  deleteMedication: async (token: string, medicationId: string) => {
    const response = await axios.delete(`${BASE_URL}/medications/${medicationId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  // Mark medication as taken
  markMedicationTaken: async (token: string, medicationId: string) => {
    const response = await axios.put(
      `${BASE_URL}/medications/${medicationId}/taken`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data.data;
  }
};