import axios, { AxiosInstance, AxiosError } from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables - ensure this happens before any API calls
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

/**
 * Get API base URL from environment
 */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || process.env.PLAYWRIGHT_API_URL || '';
}

/**
 * Create API client instance
 */
export function createApiClient(): AxiosInstance {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    throw new Error('API_BASE_URL environment variable is not set. Make sure .env.local contains NEXT_PUBLIC_API_URL.');
  }

  const client = axios.create({
    baseURL: apiBaseUrl,
    timeout: 90000, // Increased for NSGA-II diet recommendation (can take 10+ seconds)
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Test API endpoint availability
 */
export async function testApiConnection(): Promise<boolean> {
  try {
    const client = createApiClient();
    const response = await client.get('/auth/countries/');
    return response.status === 200;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
}

/**
 * Register a new user
 */
export async function registerUser(data: {
  name: string;
  email_id: string;
  pin: string;
  country_id: string;
}): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/auth/register', data);
  return response.data;
}

/**
 * Login user
 */
export async function loginUser(data: {
  email_id: string;
  pin: string;
}): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/auth/login/', data);
  return response.data;
}

/**
 * Get user profile
 */
export async function getUserProfile(emailId: string): Promise<any> {
  const client = createApiClient();
  const response = await client.get(`/auth/user/${emailId}`);
  return response.data;
}

/**
 * Get all countries
 */
export async function getCountries(): Promise<any[]> {
  const client = createApiClient();
  const response = await client.get('/auth/countries');
  return response.data;
}

/**
 * Get feed types
 */
export async function getFeedTypes(
  countryId: string,
  userId: string
): Promise<string[]> {
  const client = createApiClient();
  const response = await client.get(`/unique-feed-type/${countryId}/${userId}`);
  return response.data;
}

/**
 * Get feed categories
 */
export async function getFeedCategories(
  feedType: string,
  countryId: string,
  userId: string
): Promise<any> {
  const client = createApiClient();
  const response = await client.get('/unique-feed-category/', {
    params: {
      feed_type: feedType,
      country_id: countryId,
      user_id: userId,
    },
  });
  return response.data;
}

/**
 * Get feed subcategories
 */
export async function getFeedSubCategories(
  feedType: string,
  feedCategory: string,
  countryId: string,
  userId: string
): Promise<any[]> {
  const client = createApiClient();
  const response = await client.get('/feed-name/', {
    params: {
      feed_type: feedType,
      feed_category: feedCategory,
      country_id: countryId,
      user_id: userId,
    },
  });
  return response.data;
}

/**
 * Get feed details
 */
export async function getFeedDetails(data: {
  feed_id: string;
  user_id: string;
  country_id: string;
}): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/check-insert-or-update/', data);
  return response.data;
}

/**
 * Get diet recommendation
 */
export async function getDietRecommendation(data: any): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/diet-recommendation-working/', data);
  return response.data;
}

/**
 * Get diet evaluation
 */
export async function getDietEvaluation(data: any): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/diet-evaluation-working/', data);
  return response.data;
}

/**
 * Save report
 */
export async function saveReport(data: {
  report_id: string;
  user_id: string;
}): Promise<any> {
  const client = createApiClient();
  const response = await client.post('/save-report/', data);
  return response.data;
}

/**
 * Get user reports
 */
export async function getUserReports(userId: string): Promise<any> {
  const client = createApiClient();
  const response = await client.get('/get-user-reports/', {
    params: { user_id: userId },
  });
  return response.data;
}

/**
 * Submit feedback
 */
export async function submitFeedback(
  userId: string,
  data: {
    feedback_type: string;
    text_feedback?: string;
    overall_rating?: number;
  }
): Promise<any> {
  const client = createApiClient();
  const response = await client.post(
    `/user-feedback/submit?user_id=${userId}`,
    data
  );
  return response.data;
}

/**
 * Admin: Get users
 */
export async function adminGetUsers(
  adminUserId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }
): Promise<any> {
  const client = createApiClient();
  const response = await client.get('/admin/users', {
    params: {
      admin_user_id: adminUserId,
      ...params,
    },
  });
  return response.data;
}

/**
 * Admin: Toggle user status
 */
export async function adminToggleUserStatus(
  adminUserId: string,
  userId: string,
  isActive: boolean
): Promise<any> {
  const client = createApiClient();
  const response = await client.put(
    `/admin/users/${userId}/toggle-status?admin_user_id=${adminUserId}`,
    { is_active: isActive }
  );
  return response.data;
}

/**
 * Admin: Add feed
 */
export async function adminAddFeed(
  adminUserId: string,
  feedData: any
): Promise<any> {
  const client = createApiClient();
  const response = await client.post(
    `/admin/add-feed?admin_user_id=${adminUserId}`,
    feedData
  );
  return response.data;
}

/**
 * Admin: Update feed
 */
export async function adminUpdateFeed(
  adminUserId: string,
  feedId: string,
  feedData: any
): Promise<any> {
  const client = createApiClient();
  const response = await client.put(
    `/admin/update-feed/${feedId}?admin_user_id=${adminUserId}`,
    feedData
  );
  return response.data;
}

/**
 * Admin: Delete feed
 */
export async function adminDeleteFeed(
  adminUserId: string,
  feedId: string
): Promise<any> {
  const client = createApiClient();
  const response = await client.delete(
    `/admin/delete-feed/${feedId}?admin_user_id=${adminUserId}`
  );
  return response.data;
}

/**
 * Admin: Get feeds
 */
export async function adminGetFeeds(
  adminUserId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }
): Promise<any> {
  const client = createApiClient();
  const response = await client.get('/admin/list-feeds/', {
    params: {
      admin_user_id: adminUserId,
      ...params,
    },
  });
  return response.data;
}

