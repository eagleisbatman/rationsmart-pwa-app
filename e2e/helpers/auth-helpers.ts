import { Page } from '@playwright/test';
import {
  registerUser,
  loginUser,
} from './api-helpers';
import { deleteTestUserById, deleteTestUser } from './db-helpers';

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
    userId: response.user_id || response.id,
    name,
    countryId,
  };
}

/**
 * Login user via UI
 */
export async function loginAsUser(
  page: Page,
  email: string,
  pin: string
): Promise<void> {
  // Use relative URL - Playwright will use baseURL from config
  await page.goto('/login');
  await page.fill('input[name="email_id"]', email);
  await page.fill('input[name="pin"]', pin);
  await page.click('button[type="submit"]');
  // Wait for navigation after login
  await page.waitForURL(/^\/(cattle-info|admin|profile)/, { timeout: 10000 });
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
    localStorage.setItem('auth-store', JSON.stringify({
      user: data.user,
      isAuthenticated: true,
      userId: data.user_id,
    }));
  }, response);
  
  // Reload to apply auth state
  await page.reload();
  await page.waitForLoadState('networkidle');
  
  return {
    userId: response.user_id || response.id,
    token: response.token,
  };
}

/**
 * Logout user
 */
export async function logoutUser(page: Page): Promise<void> {
  // Clear auth state
  await page.evaluate(() => {
    localStorage.removeItem('auth-store');
  });
  await page.goto('/login');
}

/**
 * Cleanup test user
 */
export async function cleanupTestUser(
  email: string,
  userId?: string
): Promise<void> {
  try {
    if (userId) {
      await deleteTestUserById(userId);
    } else {
      await deleteTestUser(email);
    }
  } catch (error) {
    console.error(`Failed to cleanup test user ${email}:`, error);
  }
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
      const authStore = localStorage.getItem('auth-store');
      if (!authStore) return !expected;
      const auth = JSON.parse(authStore);
      return auth.isAuthenticated === expected;
    },
    isAuthenticated
  );
}

