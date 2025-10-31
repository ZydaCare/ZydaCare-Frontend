export interface RelatedLink {
  title: string;
  url: string;
  description?: string;
  isExternal?: boolean;
}

export interface MediaItem {
  type: 'image' | 'video' | 'document';
  url: string;
  title?: string;
  caption?: string;
}

export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  shortAnswer?: string;
  category: string;
  subcategory?: string;
  forRoles: string[];
  relatedLinks?: RelatedLink[];
  media?: MediaItem[];
  tags?: string[];
  displayOrder?: number;
  viewCount: number;
  helpfulCount: number;
  notHelpfulCount: number;
  isFeatured: boolean;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  relatedFAQs?: Array<{
    _id: string;
    question: string;
    shortAnswer?: string;
    category: string;
    tags?: string[];
  }>;
  lastUpdatedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  publishedAt?: string | Date;
  expiresAt?: string | Date;
  createdAt: string;
  updatedAt: string;
  helpfulnessRatio?: string;
}

export interface FAQStats {
  totalFAQs: number;
  activeFAQs: number;
  featuredFAQs: number;
  totalViews: number;
  totalHelpful: number;
  totalNotHelpful: number;
  avgViewCount: number;
}

export interface FAQCategoryStats {
  _id: string;
  count: number;
  views: number;
}

export interface FAQListResponse {
  success: boolean;
  count: number;
  total: number;
  data: FAQ[];
  pagination?: {
    next?: { page: number; limit: number };
    prev?: { page: number; limit: number };
  };
}

export interface FAQResponse {
  success: boolean;
  data: FAQ;
}

export interface FAQStatsResponse {
  success: boolean;
  data: {
    overview: FAQStats;
    byCategory: FAQCategoryStats[];
  };
}

export interface CreateFAQPayload {
  question: string;
  answer: string;
  shortAnswer?: string;
  category: string;
  subcategory?: string;
  forRoles: string[];
  relatedLinks?: Omit<RelatedLink, '_id'>[];
  media?: Omit<MediaItem, '_id'>[];
  tags?: string[];
  displayOrder?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  relatedFAQs?: string[];
  publishedAt?: string | Date;
  expiresAt?: string | Date;
}

export interface UpdateFAQPayload extends Partial<Omit<CreateFAQPayload, 'relatedFAQs'>> {
  id: string;
  relatedFAQs?: string[];
}

export interface ReorderFAQsPayload {
  id: string;
  displayOrder: number;
}[];

export interface FAQFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  sort?: string;
}
