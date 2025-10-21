import axios from 'axios';
import { BASE_URL } from '@/config';

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  forRoles: string | string[];
  isActive: boolean;
  relatedFAQs?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQResponse {
  success: boolean;
  count: number;
  data: Record<string, FAQItem[]>;
}

export const getFAQs = async (category?: string, search?: string): Promise<FAQResponse> => {
  try {
    const response = await axios.get<FAQResponse>(
      `${BASE_URL}/faq`,
      {
        params: {
          ...(category && { category }),
          ...(search && { search }),
          role: 'doctor'  // Set role to 'doctor' for doctor-specific FAQs
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to fetch FAQs');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getFAQs:', error);
    throw error;
  }
};

export const getFAQById = async (id: string): Promise<FAQItem> => {
  try {
    const response = await axios.get<{ success: boolean; data: FAQItem }>(
      `${BASE_URL}/faq/${id}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to fetch FAQ');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error in getFAQById:', error);
    throw error;
  }
};
