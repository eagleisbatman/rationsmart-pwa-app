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
 * Login user via UI - the most reliable method
 */
export async function loginAsUser(
  page: Page,
  email: string,
  pin: string
): Promise<void> {
  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Wait for form to be ready
  await page.waitForSelector('input[name="email_id"]', { timeout: 10000 });

  // Fill login form
  await page.fill('input[name="email_id"]', email);
  await page.fill('input[name="pin"]', pin);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation after successful login
  // The app redirects to /cattle-info on successful login
  try {
    await page.waitForURL(/\/(cattle-info|admin|profile)/, { timeout: 20000 });
    console.log(`Successfully logged in as ${email}`);
  } catch (error) {
    // Check if we're still on login (might indicate login failure)
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Check for error messages
      const errorMsg = await page.locator('[data-sonner-toast], .text-destructive, .text-red').first().textContent().catch(() => null);
      throw new Error(`Login failed for ${email}. Still on login page. Error: ${errorMsg || 'Unknown'}`);
    }
    console.log(`Login navigation completed to: ${currentUrl}`);
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

/**
 * Fill cattle info form and navigate to feed selection
 * This uses in-app navigation to avoid Zustand hydration race condition
 */
export async function fillCattleInfoAndNavigate(page: Page): Promise<void> {
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // Check if we're on cattle-info page
  if (!page.url().includes('/cattle-info')) {
    console.log('Not on cattle-info page, current URL:', page.url());
    return;
  }

  // Fill numeric inputs
  const fillInput = async (name: string, value: string) => {
    const input = page.locator(`input[name="${name}"]`);
    if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
      await input.clear();
      await input.fill(value);
      await page.waitForTimeout(100);
    }
  };

  // Fill breed - click button with "Select breed" placeholder
  const breedTrigger = page.locator('button:has-text("Select breed")').first();
  if (await breedTrigger.isVisible({ timeout: 5000 }).catch(() => false)) {
    await breedTrigger.click();
    await page.waitForTimeout(500);
    // Select Holstein from the dropdown
    await page.locator('[role="option"]').filter({ hasText: 'Holstein' }).first().click();
    await page.waitForTimeout(500);
  } else {
    console.log('Breed dropdown not found');
  }

  // Fill animal characteristics
  await fillInput('body_weight', '500');
  await fillInput('bc_score', '3');
  await fillInput('bw_gain', '0');

  // Check lactating checkbox if not already checked
  const lactatingCheckbox = page.locator('input[type="checkbox"]').first();
  if (await lactatingCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
    const isChecked = await lactatingCheckbox.isChecked();
    if (!isChecked) {
      await lactatingCheckbox.check();
      await page.waitForTimeout(500);
    }
  }

  // Fill milk-related fields (shown when lactating is checked)
  await fillInput('milk_production', '20');
  await fillInput('fat_milk', '4');
  await fillInput('tp_milk', '3.5');
  await fillInput('days_in_milk', '100');

  // Fill reproductive data
  await fillInput('parity', '2');
  await fillInput('calving_interval', '400');
  await fillInput('days_of_pregnancy', '0');

  // Fill environment data
  await fillInput('distance', '0');
  await fillInput('temperature', '25');

  // Fill topography - click button with "Select topography" placeholder
  const topographyTrigger = page.locator('button:has-text("Select topography")').first();
  if (await topographyTrigger.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking topography dropdown');
    await topographyTrigger.click();
    await page.waitForTimeout(500);
    // Select Flat from the dropdown
    await page.locator('[role="option"]').filter({ hasText: 'Flat' }).first().click();
    await page.waitForTimeout(500);
  } else {
    console.log('Topography dropdown not found - scrolling to find it');
    // Scroll down to find topography
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Try again after scrolling
    const topographyTrigger2 = page.locator('button:has-text("Select topography")').first();
    if (await topographyTrigger2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await topographyTrigger2.click();
      await page.waitForTimeout(500);
      await page.locator('[role="option"]').filter({ hasText: 'Flat' }).first().click();
      await page.waitForTimeout(500);
    } else {
      console.log('Topography dropdown still not found after scroll');
    }
  }

  // Take screenshot before clicking Continue
  await page.screenshot({ path: 'test-results/before-continue-click.png' });

  // Click Continue button
  const continueButton = page.locator('button[type="submit"]').filter({ hasText: 'Continue' });
  if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('Clicking Continue to navigate to feed-selection...');
    await continueButton.click();

    // Wait for navigation to feed-selection
    try {
      await page.waitForURL('**/feed-selection**', { timeout: 15000 });
      console.log('Successfully navigated to feed-selection');
    } catch {
      console.log('Navigation timeout - current URL:', page.url());
      // Take screenshot to debug
      await page.screenshot({ path: 'test-results/navigation-timeout.png' });
    }
  } else {
    console.log('Continue button not found');
  }

  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

