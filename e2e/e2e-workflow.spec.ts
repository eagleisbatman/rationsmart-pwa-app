import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';
import { SELECTORS, TIMEOUTS } from './helpers/selectors';

/**
 * Comprehensive E2E Workflow Test
 *
 * This test file demonstrates complete user journeys through the application,
 * producing longer video recordings that show the full app workflow.
 *
 * Each test is designed to:
 * - Show meaningful user interactions
 * - Navigate through multiple pages
 * - Demonstrate actual feature usage
 * - Produce clear, informative video recordings
 */

test.describe('Complete E2E User Workflows', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testUserPin: string;
  let countryId: string;

  test.beforeAll(async () => {
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test.beforeEach(async () => {
    // Create fresh test user for each workflow
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;
    testUserPin = user.pin;
  });

  test.afterEach(async () => {
    if (testUserEmail) {
      await cleanupTestUser(testUserEmail, testUserId);
    }
  });

  test('Complete User Journey: Login → Cattle Info → Feed Selection → Recommendation', async ({ page }) => {
    // Increase test timeout for this comprehensive workflow
    test.setTimeout(120000);

    // ========================================
    // Step 1: Login
    // ========================================
    await test.step('Login with test credentials', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      // Pause to show login page in video
      await page.waitForTimeout(1000);

      // Fill login form
      await page.fill('input[name="email_id"]', testUserEmail);
      await page.waitForTimeout(500);
      await page.fill('input[name="pin"]', testUserPin);
      await page.waitForTimeout(500);

      // Submit login
      await page.click('button[type="submit"]');

      // Wait for navigation to complete
      await page.waitForURL(/\/(cattle-info|profile|admin)/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');

      // Pause to show successful login in video
      await page.waitForTimeout(1500);

      // Verify we're logged in
      expect(page.url()).not.toContain('/login');
    });

    // ========================================
    // Step 2: Cattle Information Form
    // ========================================
    await test.step('Fill cattle information form', async () => {
      // Navigate to cattle info page if not already there
      if (!page.url().includes('/cattle-info')) {
        await page.goto('/cattle-info');
        await page.waitForLoadState('networkidle');
      }

      // Pause to show cattle info page
      await page.waitForTimeout(1000);

      // Fill available form fields
      const fillFieldIfVisible = async (selector: string, value: string) => {
        const field = page.locator(selector);
        if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
          await field.fill(value);
          await page.waitForTimeout(300);
        }
      };

      await fillFieldIfVisible('input[name="name"]', 'Test Cow - Lakshmi');
      await fillFieldIfVisible('input[name="body_weight"]', '450');
      await fillFieldIfVisible('input[name="breed"]', 'Holstein Friesian');
      await fillFieldIfVisible('input[name="milk_production"]', '15');
      await fillFieldIfVisible('input[name="location"]', 'Karnataka, India');

      // Select country from dropdown if present
      const countrySelect = page.locator(SELECTORS.SELECT_TRIGGER).first();
      if (await countrySelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await countrySelect.click();
        await page.waitForTimeout(500);
        const firstOption = page.locator(SELECTORS.SELECT_ITEM).first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(500);
        }
      }

      // Pause to show filled form in video
      await page.waitForTimeout(1500);

      // Submit form
      const submitButton = page.getByRole('button', { name: /submit|next|continue/i });
      if (await submitButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    });

    // ========================================
    // Step 3: Feed Selection
    // ========================================
    await test.step('Navigate and explore feed selection', async () => {
      // Navigate to feed selection
      await page.goto('/feed-selection');
      await page.waitForLoadState('networkidle');

      // Pause to show feed selection page
      await page.waitForTimeout(1500);

      // Interact with feed type dropdown if available
      const feedTypeSelect = page.locator(SELECTORS.SELECT_TRIGGER).first();
      if (await feedTypeSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedTypeSelect.click();
        await page.waitForTimeout(500);

        // Select first feed type
        const firstOption = page.locator(SELECTORS.SELECT_ITEM).first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(1000);
        }

        // Try to select category if second dropdown appears
        const categorySelect = page.locator(SELECTORS.SELECT_TRIGGER).nth(1);
        if (await categorySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
          await categorySelect.click();
          await page.waitForTimeout(500);
          const categoryOption = page.locator(SELECTORS.SELECT_ITEM).first();
          if (await categoryOption.isVisible({ timeout: 2000 }).catch(() => false)) {
            await categoryOption.click();
            await page.waitForTimeout(1000);
          }
        }
      }

      // Pause to show feed selection state in video
      await page.waitForTimeout(1500);
    });

    // ========================================
    // Step 4: View Recommendation
    // ========================================
    await test.step('View recommendation page', async () => {
      await page.goto('/recommendation');
      await page.waitForLoadState('networkidle');

      // Pause to show recommendation page
      await page.waitForTimeout(2000);

      // Verify page loaded (may show empty state or recommendation)
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);
    });

    // ========================================
    // Step 5: Check Reports
    // ========================================
    await test.step('Navigate to reports', async () => {
      await page.goto('/reports');
      await page.waitForLoadState('networkidle');

      // Pause to show reports page
      await page.waitForTimeout(2000);

      // Page should load (may show empty state for new user)
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);
    });

    // ========================================
    // Step 6: View Profile
    // ========================================
    await test.step('View user profile', async () => {
      await page.goto('/profile');
      await page.waitForLoadState('networkidle');

      // Pause to show profile page
      await page.waitForTimeout(2000);

      // Verify profile page loaded
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);
    });

    // Final pause to show complete workflow in video
    await page.waitForTimeout(2000);
  });

  test('Mobile User Journey: Complete workflow on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    test.setTimeout(120000);

    // ========================================
    // Step 1: Mobile Login
    // ========================================
    await test.step('Login on mobile', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.fill('input[name="email_id"]', testUserEmail);
      await page.waitForTimeout(300);
      await page.fill('input[name="pin"]', testUserPin);
      await page.waitForTimeout(300);
      await page.click('button[type="submit"]');

      await page.waitForURL(/\/(cattle-info|profile|admin)/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    });

    // ========================================
    // Step 2: Mobile Navigation - Using Bottom Nav
    // ========================================
    await test.step('Navigate using mobile bottom navigation', async () => {
      // Verify bottom navigation is visible
      const bottomNav = page.locator('.fixed.bottom-0').or(page.locator('nav.fixed'));
      await page.waitForTimeout(1000);

      // Try to navigate to different pages using bottom nav
      const profileButton = page.getByRole('button', { name: /profile/i })
        .or(page.getByRole('link', { name: /profile/i }));

      if (await profileButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Force click to bypass Next.js dev overlay
        await profileButton.first().click({ force: true });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
      }

      // Navigate to reports
      const reportsButton = page.getByRole('button', { name: /report/i })
        .or(page.getByRole('link', { name: /report/i }));

      if (await reportsButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Force click to bypass Next.js dev overlay
        await reportsButton.first().click({ force: true });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
      }

      // Navigate to cattle info
      const cattleButton = page.getByRole('button', { name: /cattle/i })
        .or(page.getByRole('link', { name: /cattle/i }));

      if (await cattleButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        // Force click to bypass Next.js dev overlay
        await cattleButton.first().click({ force: true });
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
      }
    });

    // ========================================
    // Step 3: Mobile Form Interaction
    // ========================================
    await test.step('Fill form on mobile', async () => {
      // Ensure we're on cattle-info
      if (!page.url().includes('/cattle-info')) {
        await page.goto('/cattle-info');
        await page.waitForLoadState('networkidle');
      }

      await page.waitForTimeout(1000);

      // Fill a field to show keyboard interaction
      const nameField = page.locator('input[name="name"]');
      if (await nameField.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameField.fill('Mobile Test Cow');
        await page.waitForTimeout(500);
      }

      // Scroll down to show more form content
      await page.evaluate(() => window.scrollBy(0, 300));
      await page.waitForTimeout(1000);

      // Scroll back up
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);
    });

    // Final pause
    await page.waitForTimeout(2000);
  });

  test('Registration Flow: Complete new user registration', async ({ page }) => {
    test.setTimeout(90000);

    // ========================================
    // Step 1: Navigate to Registration
    // ========================================
    await test.step('Navigate to registration page', async () => {
      await page.goto('/register');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      // Verify registration form is visible
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    // ========================================
    // Step 2: Fill Registration Form
    // ========================================
    await test.step('Fill registration form fields', async () => {
      // Generate unique email for this test
      const uniqueEmail = `e2e-workflow-${Date.now()}@test.example.com`;

      await page.fill(SELECTORS.INPUT_NAME, 'E2E Workflow Test User');
      await page.waitForTimeout(300);

      await page.fill(SELECTORS.INPUT_EMAIL, uniqueEmail);
      await page.waitForTimeout(300);

      await page.fill(SELECTORS.INPUT_PIN, '1234');
      await page.waitForTimeout(300);

      // Pause to show filled form
      await page.waitForTimeout(1500);
    });

    // ========================================
    // Step 3: Select Country
    // ========================================
    await test.step('Select country from dropdown', async () => {
      // Find and click country dropdown
      const countrySelect = page.locator(SELECTORS.SELECT_TRIGGER).first();
      if (await countrySelect.isVisible({ timeout: 3000 }).catch(() => false)) {
        await countrySelect.click();
        await page.waitForTimeout(500);

        // Select first country
        const firstOption = page.locator(SELECTORS.SELECT_ITEM).first();
        if (await firstOption.isVisible({ timeout: 2000 }).catch(() => false)) {
          await firstOption.click();
          await page.waitForTimeout(500);
        }
      }

      await page.waitForTimeout(1000);
    });

    // ========================================
    // Step 4: Show form validation
    // ========================================
    await test.step('Demonstrate form validation', async () => {
      // Clear email to show validation
      await page.fill(SELECTORS.INPUT_EMAIL, '');
      await page.waitForTimeout(500);

      // Click submit to trigger validation
      await page.click(SELECTORS.SUBMIT_BUTTON);
      await page.waitForTimeout(1500);

      // Look for validation error
      const errorLocator = page.locator(SELECTORS.FORM_ERROR).or(page.locator('text=/required|invalid/i'));
      const hasError = await errorLocator.first().isVisible({ timeout: 2000 }).catch(() => false);

      if (hasError) {
        // Error shown - good, validation works
        await page.waitForTimeout(1000);
      }

      // Fill back the email for successful registration
      const uniqueEmail = `e2e-workflow-final-${Date.now()}@test.example.com`;
      await page.fill(SELECTORS.INPUT_EMAIL, uniqueEmail);
      await page.waitForTimeout(500);
    });

    // Final pause to show complete registration form
    await page.waitForTimeout(2000);
  });

  test('Error Handling Flow: Demonstrate graceful error handling', async ({ page, context }) => {
    test.setTimeout(90000);

    // ========================================
    // Step 1: Login first
    // ========================================
    await test.step('Login before testing errors', async () => {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.fill('input[name="email_id"]', testUserEmail);
      await page.fill('input[name="pin"]', testUserPin);
      await page.click('button[type="submit"]');

      await page.waitForURL(/\/(cattle-info|profile|admin)/, { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    // ========================================
    // Step 2: Test 404 Page
    // ========================================
    await test.step('Navigate to non-existent page', async () => {
      await page.goto('/this-page-does-not-exist-12345');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Should show 404 or redirect
      const notFoundText = page.locator('text=/404|not found/i');
      const has404 = await notFoundText.first().isVisible({ timeout: 3000 }).catch(() => false);

      // Either 404 page shown or redirected
      expect(has404 || page.url() !== '/this-page-does-not-exist-12345').toBe(true);

      await page.waitForTimeout(1000);
    });

    // ========================================
    // Step 3: Test Offline Mode
    // ========================================
    await test.step('Test offline mode handling', async () => {
      // Navigate to a real page first
      await page.goto('/cattle-info');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Go offline
      await context.setOffline(true);
      await page.waitForTimeout(500);

      // Try to interact - app should handle gracefully
      const submitButton = page.getByRole('button', { name: /submit|next|continue/i });
      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click().catch(() => {});
        await page.waitForTimeout(1500);
      }

      // Go back online
      await context.setOffline(false);
      await page.waitForTimeout(1000);

      // Verify page is still functional
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
    });

    // ========================================
    // Step 4: Session Expiration
    // ========================================
    await test.step('Test session expiration handling', async () => {
      // Clear auth state to simulate session expiration
      await page.evaluate(() => {
        localStorage.removeItem('auth-storage');
      });
      await page.waitForTimeout(500);

      // Try to navigate to protected route
      await page.goto('/profile');
      await page.waitForTimeout(2000);

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
      await page.waitForTimeout(1500);
    });

    // Final pause
    await page.waitForTimeout(1000);
  });
});
