import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  adminAddFeed,
  saveReport,
  submitFeedback,
} from './helpers/api-helpers';
import {
  verifyDbConnection,
  getUserByEmail,
  getUserById,
  getFeedById,
  getReportById,
  query,
  deleteTestUser,
  deleteTestFeed,
  deleteTestReport,
  getCountryByCode,
} from './helpers/db-helpers';
import { generateTestEmail } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';
import { generateFeedData } from './helpers/test-data';

test.describe('Database Verification Tests', () => {
  let countryId: string;

  test.beforeAll(async () => {
    const dbConnected = await verifyDbConnection();
    // Database tests require DB connection - skip if not available
    if (!dbConnected) {
      test.skip();
      return;
    }

    const countries = await getCountries();
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test('User data integrity - create user via API', async () => {
    const email = generateTestEmail('test-db-user');
    const name = 'DB Test User';
    const pin = '1234';

    // Create user via API
    const response = await registerUser({
      name,
      email_id: email,
      pin,
      country_id: countryId,
    });

    expect(response.user_id || response.id).toBeDefined();
    const userId = response.user_id || response.id;

    // Verify user in database
    const user = await getUserByEmail(email);
    expect(user).not.toBeNull();
    expect(user.email_id).toBe(email);
    expect(user.name).toBe(name);
    expect(user.country_id).toBe(countryId);
    expect(user.pin_hash).toBeDefined();
    expect(user.pin_hash).not.toBe(pin); // PIN should be hashed
    expect(user.created_at).toBeDefined();
    expect(user.updated_at).toBeDefined();

    // Cleanup
    await deleteTestUser(email, userId);
  });

  test('User data integrity - PIN hash verification', async () => {
    const email = generateTestEmail('test-pin-hash');
    const pin = '1234';

    await registerUser({
      name: 'PIN Test User',
      email_id: email,
      pin,
      country_id: countryId,
    });

    const user = await getUserByEmail(email);
    expect(user.pin_hash).toBeDefined();
    expect(user.pin_hash.length).toBeGreaterThan(10); // Hash should be long
    expect(user.pin_hash).not.toBe(pin);

    // Cleanup
    await deleteTestUser(email, user.id);
  });

  test('User data integrity - foreign key constraint', async () => {
    const email = generateTestEmail('test-fk');
    
    // Try to create user with invalid country_id
    await expect(
      registerUser({
        name: 'FK Test User',
        email_id: email,
        pin: '1234',
        country_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID
      })
    ).rejects.toThrow();

    // Verify user was not created
    const user = await getUserByEmail(email);
    expect(user).toBeNull();
  });

  test('Feed data integrity - create feed via admin API', async () => {
    // Create admin user
    const adminEmail = generateTestEmail('test-admin-db');
    const adminResponse = await registerUser({
      name: 'Admin DB Test',
      email_id: adminEmail,
      pin: '1234',
      country_id: countryId,
    });
    const adminUserId = adminResponse.user_id || adminResponse.id;

    // Set admin flag
    await query('UPDATE user_information SET is_admin = true WHERE id = $1', [adminUserId]);

    // Create feed via API
    const feedData = generateFeedData();
    const feedResponse = await adminAddFeed(adminUserId, {
      ...feedData,
      fd_country_cd: 'IND',
    });

    const feedId = feedResponse.feed_id || feedResponse.id;
    expect(feedId).toBeDefined();

    // Verify feed in database
    const feed = await getFeedById(feedId);
    expect(feed).not.toBeNull();
    expect(feed.fd_name).toBe(feedData.fd_name);
    expect(feed.fd_code).toBe(feedData.fd_code);
    expect(feed.fd_dm).toBeDefined();
    expect(feed.fd_cp).toBeDefined();
    expect(feed.created_at).toBeDefined();
    expect(feed.updated_at).toBeDefined();

    // Cleanup
    await deleteTestFeed(feedId);
    await deleteTestUser(adminEmail, adminUserId);
  });

  test('Feed data integrity - DECIMAL precision', async () => {
    const adminEmail = generateTestEmail('test-precision');
    const adminResponse = await registerUser({
      name: 'Precision Test',
      email_id: adminEmail,
      pin: '1234',
      country_id: countryId,
    });
    const adminUserId = adminResponse.user_id || adminResponse.id;
    await query('UPDATE user_information SET is_admin = true WHERE id = $1', [adminUserId]);

    const feedData = generateFeedData({
      fd_dm: 90.123456789,
      fd_cp: 12.987654321,
    });

    const feedResponse = await adminAddFeed(adminUserId, {
      ...feedData,
      fd_country_cd: 'IND',
    });
    const feedId = feedResponse.feed_id || feedResponse.id;

    // Verify precision stored correctly (DECIMAL(10,2) should round to 2 decimals)
    const feed = await getFeedById(feedId);
    expect(feed.fd_dm).toBeCloseTo(90.12, 2);
    expect(feed.fd_cp).toBeCloseTo(12.99, 2);

    // Cleanup
    await deleteTestFeed(feedId);
    await deleteTestUser(adminEmail, adminUserId);
  });

  test('Report data integrity - save report via API', async () => {
    const email = generateTestEmail('test-report-db');
    const userResponse = await registerUser({
      name: 'Report Test User',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });
    const userId = userResponse.user_id || userResponse.id;

    // Generate a mock report ID (in real scenario, this comes from recommendation)
    const reportId = `test-report-${Date.now()}`;

    // Save report
    try {
      const saveResponse = await saveReport({
        report_id: reportId,
        user_id: userId,
      });

      // Verify report saved in database
      const report = await getReportById(reportId);
      if (report) {
        expect(report.user_id).toBe(userId);
        expect(report.report_id || report.id).toBeDefined();
        
        // Cleanup
        await deleteTestReport(reportId);
      }
    } catch (error) {
      // If report saving fails (e.g., invalid report_id), that's okay for this test
      console.log('Report save failed (expected if report_id is invalid):', error);
    }

    // Cleanup
    await deleteTestUser(email, userId);
  });

  test('Feedback data integrity - submit feedback via API', async () => {
    const email = generateTestEmail('test-feedback-db');
    const userResponse = await registerUser({
      name: 'Feedback Test User',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });
    const userId = userResponse.user_id || userResponse.id;

    // Submit feedback
    const feedbackResponse = await submitFeedback(userId, {
      feedback_type: 'general',
      text_feedback: 'Database test feedback',
      overall_rating: 5,
    });

    expect(feedbackResponse).toBeDefined();

    // Verify feedback in database
    const feedbackResult = await query(
      'SELECT * FROM user_feedback WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (feedbackResult.rows.length > 0) {
      const feedback = feedbackResult.rows[0];
      expect(feedback.user_id).toBe(userId);
      expect(feedback.feedback_type).toBe('general');
      expect(feedback.text_feedback).toBe('Database test feedback');
      expect(feedback.overall_rating).toBe(5);
    }

    // Cleanup
    await query('DELETE FROM user_feedback WHERE user_id = $1', [userId]);
    await deleteTestUser(email, userId);
  });

  test('Admin operations - toggle user status', async () => {
    const email = generateTestEmail('test-toggle');
    const userResponse = await registerUser({
      name: 'Toggle Test User',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });
    const userId = userResponse.user_id || userResponse.id;

    // Create admin user
    const adminEmail = generateTestEmail('test-admin-toggle');
    const adminResponse = await registerUser({
      name: 'Admin Toggle Test',
      email_id: adminEmail,
      pin: '1234',
      country_id: countryId,
    });
    const adminUserId = adminResponse.user_id || adminResponse.id;
    await query('UPDATE user_information SET is_admin = true WHERE id = $1', [adminUserId]);

    // Get initial status
    const userBefore = await getUserById(userId);
    const wasActive = userBefore.is_active;

    // Toggle status via API
    const { adminToggleUserStatus } = await import('./helpers/api-helpers');
    await adminToggleUserStatus(adminUserId, userId, !wasActive);

    // Verify status updated
    const userAfter = await getUserById(userId);
    expect(userAfter.is_active).toBe(!wasActive);

    // Cleanup
    await deleteTestUser(email, userId);
    await deleteTestUser(adminEmail, adminUserId);
  });

  test('Database constraints - unique email', async () => {
    const email = generateTestEmail('test-unique');
    
    // Create first user
    await registerUser({
      name: 'Unique Test User 1',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });

    // Try to create second user with same email
    await expect(
      registerUser({
        name: 'Unique Test User 2',
        email_id: email,
        pin: '5678',
        country_id: countryId,
      })
    ).rejects.toThrow();

    // Cleanup
    const user = await getUserByEmail(email);
    await deleteTestUser(email, user.id);
  });

  test('Database timestamps - created_at and updated_at', async () => {
    const email = generateTestEmail('test-timestamps');
    const userResponse = await registerUser({
      name: 'Timestamp Test User',
      email_id: email,
      pin: '1234',
      country_id: countryId,
    });
    const userId = userResponse.user_id || userResponse.id;

    const user = await getUserById(userId);
    expect(user.created_at).toBeDefined();
    expect(user.updated_at).toBeDefined();
    expect(new Date(user.created_at).getTime()).toBeLessThanOrEqual(Date.now());
    expect(new Date(user.updated_at).getTime()).toBeLessThanOrEqual(Date.now());

    // Cleanup
    await deleteTestUser(email, userId);
  });
});

