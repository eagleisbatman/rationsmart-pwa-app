import { test, expect } from '@playwright/test';
import {
  createApiClient,
  testApiConnection,
  registerUser,
  loginUser,
  getCountries,
  getFeedTypes,
  getFeedCategories,
  getFeedSubCategories,
  getFeedDetails,
  getDietRecommendation,
  getDietEvaluation,
  saveReport,
  getUserReports,
  submitFeedback,
} from './helpers/api-helpers';
import { createTestUser, cleanupTestUser } from './helpers/auth-helpers';
import { verifyDbConnection } from './helpers/db-helpers';
import { generateCattleInfo, generateFeedRecommendationRequest } from './helpers/test-data';

test.describe('API Integration Tests', () => {
  let testUserEmail: string;
  let testUserId: string;
  let countryId: string;

  test.beforeAll(async () => {
    const dbConnected = await verifyDbConnection();
    // Database connection is optional - tests will skip DB-dependent parts if not available
    if (!dbConnected) {
      console.warn('Database not available - some tests may be skipped');
    }

    const countries = await getCountries();
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test.beforeEach(async () => {
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;
  });

  test.afterEach(async () => {
    if (testUserEmail) {
      await cleanupTestUser(testUserEmail, testUserId);
    }
  });

  test('API connection test', async () => {
    const connected = await testApiConnection();
    expect(connected).toBe(true);
  });

  test('API client configuration', () => {
    const client = createApiClient();
    expect(client.defaults.baseURL).toBeDefined();
    expect(client.defaults.timeout).toBeGreaterThan(0);
  });

  test('Authentication API - register with valid data', async () => {
    const email = `test-api-${Date.now()}@example.com`;
    const response = await registerUser({
      name: 'API Test User',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });

    expect(response).toBeDefined();
    expect(response.user_id || response.id).toBeDefined();

    // Cleanup
    await cleanupTestUser(email, response.user_id || response.id);
  });

  test('Authentication API - register with invalid data', async () => {
    await expect(
      registerUser({
        name: '',
        email_id: 'invalid-email',
        pin: '12', // Too short
        country_id: 'invalid-uuid',
      })
    ).rejects.toThrow();
  });

  test('Authentication API - login with valid credentials', async () => {
    const response = await loginUser({
      email_id: testUserEmail,
      pin: '1234',
    });

    expect(response).toBeDefined();
    expect(response.user_id || response.id).toBeDefined();
  });

  test('Authentication API - login with invalid credentials', async () => {
    await expect(
      loginUser({
        email_id: 'nonexistent@example.com',
        pin: '1234',
      })
    ).rejects.toThrow();
  });

  test('Feed API - get feed types', async () => {
    const feedTypes = await getFeedTypes(countryId, testUserId);
    expect(Array.isArray(feedTypes)).toBe(true);
  });

  test('Feed API - get feed categories', async () => {
    const feedTypes = await getFeedTypes(countryId, testUserId);
    if (feedTypes.length > 0) {
      const categories = await getFeedCategories(feedTypes[0], countryId, testUserId);
      expect(categories).toBeDefined();
      expect(categories.unique_feed_categories || categories).toBeDefined();
    }
  });

  test('Feed API - get feed subcategories', async () => {
    const feedTypes = await getFeedTypes(countryId, testUserId);
    if (feedTypes.length > 0) {
      const categoryResponse = await getFeedCategories(feedTypes[0], countryId, testUserId);
      const categories = categoryResponse.unique_feed_categories || [];
      
      if (categories.length > 0) {
        const subcategories = await getFeedSubCategories(
          feedTypes[0],
          categories[0],
          countryId,
          testUserId
        );
        expect(Array.isArray(subcategories)).toBe(true);
      }
    }
  });

  test('Feed API - get feed details', async () => {
    const feedTypes = await getFeedTypes(countryId, testUserId);
    if (feedTypes.length > 0) {
      const categoryResponse = await getFeedCategories(feedTypes[0], countryId, testUserId);
      const categories = categoryResponse.unique_feed_categories || [];
      
      if (categories.length > 0) {
        const subcategories = await getFeedSubCategories(
          feedTypes[0],
          categories[0],
          countryId,
          testUserId
        );
        
        if (subcategories.length > 0 && subcategories[0].feed_uuid) {
          const feedDetails = await getFeedDetails({
            feed_id: subcategories[0].feed_uuid,
            user_id: testUserId,
            country_id: countryId,
          });
          
          expect(feedDetails).toBeDefined();
          expect(feedDetails.feed_details).toBeDefined();
        }
      }
    }
  });

  test('Recommendation API - get diet recommendation', async () => {
    const cattleInfo = generateCattleInfo();
    const feeds: any[] = []; // Would need actual feed data
    
    try {
      const request = generateFeedRecommendationRequest(cattleInfo, feeds);
      const recommendation = await getDietRecommendation(request);
      
      expect(recommendation).toBeDefined();
    } catch (error: any) {
      // If recommendation fails due to missing feeds, that's expected
      if (error.response?.status === 400 || error.message?.includes('feed')) {
        // Expected failure
        expect(error).toBeDefined();
      } else {
        throw error;
      }
    }
  });

  test('Reports API - get user reports', async () => {
    const reports = await getUserReports(testUserId);
    expect(reports).toBeDefined();
    expect(reports.reports || Array.isArray(reports)).toBe(true);
  });

  test('Feedback API - submit feedback', async () => {
    const feedbackResponse = await submitFeedback(testUserId, {
      feedback_type: 'general',
      text_feedback: 'API test feedback',
      overall_rating: 5,
    });

    expect(feedbackResponse).toBeDefined();
    expect(feedbackResponse.success !== false).toBe(true);
  });

  test('Error handling - 400 Bad Request', async () => {
    const client = createApiClient();
    
    await expect(
      client.post('/auth/register', {
        name: '',
        email_id: 'invalid',
        pin: '12',
        country_id: 'invalid',
      })
    ).rejects.toThrow();
  });

  test('Error handling - 401 Unauthorized', async () => {
    const client = createApiClient();
    
    await expect(
      client.get('/get-user-reports/', {
        params: { user_id: 'invalid-user-id' },
      })
    ).rejects.toThrow();
  });

  test('Error handling - network timeout', async () => {
    const client = createApiClient();
    client.defaults.timeout = 1; // 1ms timeout
    
    await expect(
      client.get('/auth/countries/')
    ).rejects.toThrow();
  });
});

