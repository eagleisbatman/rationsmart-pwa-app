import { Page } from '@playwright/test';
import {
  registerUser,
  loginUser,
} from './api-helpers';

/**
 * Generate unique test email
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}-${timestamp}-${random}@example.com`;
}

/**
 * Create a test user via API
 */
export async function createTestUser(data?: {
  name?: string;
  email?: string;
  pin?: string;
  countryId?: string;
}): Promise<{
  email: string;
  pin: string;
  userId: string;
  name: string;
  countryId: string;
}> {
  const email = data?.email || generateTestEmail('test-user');
  const pin = data?.pin || '1234';
  const name = data?.name || 'Test User';
  
  // Get a valid country ID (you may need to adjust this)
  const countryId = data?.countryId || '';

  if (!countryId) {
    throw new Error('countryId is required. Please provide a valid country ID.');
  }

  const response = await registerUser({
    name,
    email_id: email,
    pin,
    country_id: countryId,
  });

  return {
    email,
    pin,
    userId: response.user?.id || response.user_id || response.id,
    name,
    countryId,
  };
}

/**
 * Login user via UI with fallback to API login
 */
export async function loginAsUser(
  page: Page,
  email: string,
  pin: string
): Promise<void> {
  // Try UI login first
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.fill('input[name="email_id"]', email);
  await page.fill('input[name="pin"]', pin);
  await page.click('button[type="submit"]');

  // Wait for navigation after login
  try {
    await page.waitForURL(/\/(cattle-info|admin|profile|recommendation|feed-selection|reports)/, { timeout: 15000 });
  } catch {
    // If UI login fails, fallback to API login
    console.log('UI login timed out, falling back to API login...');

    try {
      const response = await loginUser({ email_id: email, pin });

      // Set auth state directly in localStorage
      await page.evaluate((data) => {
        localStorage.setItem('auth-storage', JSON.stringify({
          state: {
            user: data.user,
            token: data.user?.id || null,
            isAuthenticated: true,
          },
          version: 0,
        }));
      }, response);

      // Navigate to cattle-info
      await page.goto('/cattle-info');
      await page.waitForLoadState('networkidle');
    } catch (apiError) {
      console.error('API login also failed:', apiError);
      throw new Error(`Login failed for ${email}: Both UI and API login attempts failed`);
    }
  }
}

/**
 * Login user via API and set auth state
 */
export async function loginAsUserViaApi(
  page: Page,
  email: string,
  pin: string
): Promise<{ userId: string; token?: string }> {
  const response = await loginUser({ email_id: email, pin });
  
  // Set auth state in localStorage (matching Zustand store)
  await page.goto('/login');
  await page.evaluate((data) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: {
        user: data.user,
        token: data.user?.id || null,
        isAuthenticated: true,
      },
      version: 0,
    }));
  }, response);
  
  // Reload to apply auth state
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  return {
    userId: response.user?.id || response.user_id || response.id,
    token: response.token,
  };
}

/**
 * Logout user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Clear auth state
  await page.evaluate(() => {
    localStorage.removeItem('auth-storage');
  });
  await page.goto('/login');
}

/**
 * Cleanup test user
 * Note: Without direct DB access, cleanup is a no-op.
 * Test users created via API will persist in the backend.
 * For production, implement a cleanup API endpoint or use test-specific database.
 */
export async function cleanupTestUser(
  email: string,
  userId?: string
): Promise<void> {
  // Without direct DB access, we can't delete test users
  // This is a no-op - test users will accumulate in the backend
  // Consider implementing a /auth/delete-test-user API endpoint for cleanup
  console.log(`Test user cleanup skipped (no API endpoint): ${email}`);
}

/**
 * Wait for authentication state
 */
export async function waitForAuthState(
  page: Page,
  isAuthenticated: boolean
): Promise<void> {
  await page.waitForFunction(
    (expected) => {
      const authStore = localStorage.getItem('auth-storage');
      if (!authStore) return !expected;
      const auth = JSON.parse(authStore);
      return auth.state?.isAuthenticated === expected;
    },
    isAuthenticated
  );
}

