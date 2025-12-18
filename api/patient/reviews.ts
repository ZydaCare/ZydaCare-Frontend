import { BASE_URL } from '@/config';
import axios from 'axios';

export interface SubmitReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
  categories?: string[];
  isAnonymous?: boolean;
}

export const submitReview = async (token: string, payload: SubmitReviewPayload) => {
  const response = await axios.post(
    `${BASE_URL}/reviews`,
    payload,
    { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );
  return response.data;
};

export const getReviewForBooking = async (token: string, bookingId: string) => {
  const response = await axios.get(
    `${BASE_URL}/reviews/booking/${bookingId}`,
    { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    }
  );
  return response.data;
};