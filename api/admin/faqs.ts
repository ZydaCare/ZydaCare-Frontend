import axios from 'axios';
import type {
  FAQ,
  CreateFAQPayload,
  UpdateFAQPayload,
  FAQListResponse,
  FAQResponse,
  FAQStatsResponse,
  FAQStats,
  FAQCategoryStats,
  ReorderFAQsPayload,
  FAQFilterParams,
} from '@/types/faq';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL as API_URL } from '@/config';

const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

// FAQ CRUD Operations
export const getFAQs = async (params?: FAQFilterParams): Promise<FAQListResponse> => {
  const config = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/admin/faq/`, {
    ...config,
    params,
  });
  return response.data;
};

export const getFAQById = async (id: string): Promise<FAQ> => {
  const config = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/admin/faq/${id}`, config);
  return response.data.data;
};

export const createFAQ = async (data: CreateFAQPayload): Promise<FAQ> => {
  const config = await getAuthHeaders();
  const response = await axios.post(
    `${API_URL}/admin/faq`,
    data,
    config
  );
  return response.data.data;
};

export const updateFAQ = async (data: UpdateFAQPayload): Promise<FAQ> => {
  const { id, ...updateData } = data;
  const config = await getAuthHeaders();
  const response = await axios.put(
    `${API_URL}/admin/faq/${id}`,
    updateData,
    config
  );
  return response.data.data;
};

export const deleteFAQ = async (id: string): Promise<void> => {
  const config = await getAuthHeaders();
  await axios.delete(`${API_URL}/admin/faq/${id}`, config);
};

// FAQ Status Management
export const toggleFAQStatus = async (id: string): Promise<FAQ> => {
  const config = await getAuthHeaders();
  const response = await axios.patch(
    `${API_URL}/admin/faq/${id}/toggle`,
    {},
    config
  );
  return response.data.data;
};

export const toggleFeaturedStatus = async (id: string): Promise<FAQ> => {
  const config = await getAuthHeaders();
  const response = await axios.patch(
    `${API_URL}/admin/faq/${id}/featured`,
    {},
    config
  );
  return response.data.data;
};

// FAQ Categories
export const getFAQCategories = async (): Promise<{
  _id: string;
  count: number;
  subcategories: string[];
}[]> => {
  const config = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/admin/faq/categories`, config);
  return response.data.data;
};

// Featured FAQs
export const getFeaturedFAQs = async (limit: number = 5): Promise<FAQ[]> => {
  const config = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/admin/faq/featured`, {
    ...config,
    params: { limit },
  });
  return response.data.data;
};

// FAQ Statistics
export const getFAQStats = async (): Promise<{
  overview: FAQStats;
  byCategory: FAQCategoryStats[];
}> => {
  const config = await getAuthHeaders();
  const response = await axios.get(`${API_URL}/admin/faq/stats`, config);
  return response.data.data;
};

// Reorder FAQs
export const reorderFAQs = async (orders: ReorderFAQsPayload): Promise<void> => {
  const config = await getAuthHeaders();
  await axios.put(
    `${API_URL}/admin/faq/reorder`,
    { orders },
    config
  );
};

// Search FAQs
export const searchFAQs = async (query: string, params?: Omit<FAQFilterParams, 'search'>): Promise<FAQListResponse> => {
  return getFAQs({
    ...params,
    search: query,
  });
};
