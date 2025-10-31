import axios from 'axios';
import { BASE_URL } from '@/config';

export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
  isExternal: boolean;
}

export interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  caption?: string;
}

export interface RelatedFAQ {
  _id: string;
  question: string;
  shortAnswer?: string;
  category: string;
  tags: string[];
}

export interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  shortAnswer?: string;
  category: string;
  subcategory?: string;
  forRoles: string[];
  tags: string[];
  relatedLinks: RelatedLink[];
  media: MediaItem[];
  relatedFAQs: RelatedFAQ[];
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  helpfulnessRatio: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FAQResponse {
  success: boolean;
  count: number;
  total: number;
  data: Record<string, FAQItem[]>;
  flatData: FAQItem[];
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
}

export interface SingleFAQResponse {
  success: boolean;
  data: FAQItem;
}

export interface FeaturedFAQResponse {
  success: boolean;
  count: number;
  data: FAQItem[];
}

export interface CategoryResponse {
  success: boolean;
  count: number;
  data: Array<{
    category: string;
    count: number;
    subcategories: string[];
  }>;
}

export interface HelpfulResponse {
  success: boolean;
  message: string;
  data: {
    helpfulCount: number;
    notHelpfulCount: number;
    helpfulnessRatio: string;
  };
}

// Get all FAQs with filtering
export const getFAQs = async (
  category?: string, 
  search?: string, 
  role: string = 'doctor',
  page: number = 1,
  limit: number = 50
): Promise<FAQResponse> => {
  try {
    const response = await axios.get<FAQResponse>(
      `${BASE_URL}/faq`,
      {
        params: {
          ...(category && { category }),
          ...(search && { search }),
          role,
          page,
          limit
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

// Get featured FAQs
export const getFeaturedFAQs = async (
  role: string = 'patient',
  limit: number = 5
): Promise<FeaturedFAQResponse> => {
  try {
    const response = await axios.get<FeaturedFAQResponse>(
      `${BASE_URL}/faq/featured`,
      {
        params: { role, limit },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to fetch featured FAQs');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getFeaturedFAQs:', error);
    throw error;
  }
};

// Get all categories
export const getFAQCategories = async (
  role: string = 'patient'
): Promise<CategoryResponse> => {
  try {
    const response = await axios.get<CategoryResponse>(
      `${BASE_URL}/faq/categories`,
      {
        params: { role },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to fetch categories');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getFAQCategories:', error);
    throw error;
  }
};

// Get popular FAQs
export const getPopularFAQs = async (
  role: string = 'patient',
  limit: number = 10
): Promise<FeaturedFAQResponse> => {
  try {
    const response = await axios.get<FeaturedFAQResponse>(
      `${BASE_URL}/faq/popular`,
      {
        params: { role, limit },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to fetch popular FAQs');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getPopularFAQs:', error);
    throw error;
  }
};

// Search FAQs
export const searchFAQs = async (
  query: string,
  role: string = 'patient',
  category?: string,
  limit: number = 20
): Promise<FeaturedFAQResponse> => {
  try {
    const response = await axios.get<FeaturedFAQResponse>(
      `${BASE_URL}/faq/search`,
      {
        params: {
          q: query,
          role,
          ...(category && { category }),
          limit
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to search FAQs');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in searchFAQs:', error);
    throw error;
  }
};

// Get single FAQ by ID
export const getFAQById = async (id: string): Promise<FAQItem> => {
  try {
    const response = await axios.get<SingleFAQResponse>(
      `${BASE_URL}/faq/${id}`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success || !response.data.data) {
      throw new Error('FAQ not found');
    }
    
    return response.data.data;
  } catch (error) {
    console.error('Error in getFAQById:', error);
    throw error;
  }
};

// Mark FAQ as helpful or not helpful
export const markFAQHelpful = async (
  id: string,
  helpful: boolean
): Promise<HelpfulResponse> => {
  try {
    const response = await axios.post<HelpfulResponse>(
      `${BASE_URL}/faq/${id}/helpful`,
      { helpful },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.data.success) {
      throw new Error('Failed to mark FAQ');
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in markFAQHelpful:', error);
    throw error;
  }
};