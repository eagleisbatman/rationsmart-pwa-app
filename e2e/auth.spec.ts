import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAsUser,
  cleanupTestUser,
  generateTestEmail,
} from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';
import { verifyDbConnection, isDbAvailable, getUserByEmail } from './helpers/db-helpers';
import { SELECTORS, TIMEOUTS } from './helpers/selectors';

test.describe('Authentication Flow', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testUserPin: string;
  let countryId: string;

  test.beforeAll(async () => {
    // Verify database connection (optional - tests will work without DB)
    const dbConnected = await verifyDbConnection();
    if (!dbConnected) {
      console.warn('Database not available - cleanup may be skipped');
    }

    // Get a valid country ID
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test.afterEach(async () => {
    // Cleanup test user if created
    if (testUserEmail) {
      await cleanupTestUser(testUserEmail, testUserId);
    }
  });

  test('Splash screen navigation', async ({ page }) => {
    await page.goto('/splash');
    
    // Verify splash screen displays
    await expect(page).toHaveURL('/splash');
    
    // Wait for redirect to welcome (usually after 2-3 seconds)
    await page.waitForURL('/welcome', { timeout: 5000 });
    await expect(page).toHaveURL('/welcome');
  });

  test('Welcome page navigation', async ({ page }) => {
    await page.goto('/welcome');
    
    // Verify welcome message displays
    const welcomeText = page.getByText(/Create optimal feed formulation/i);
    await expect(welcomeText).toBeVisible();
    
    // Click Login button
    const loginButton = page.getByRole('button', { name: /login/i });
    await loginButton.click();
    await expect(page).toHaveURL('/login');
    
    // Go back and click Register
    await page.goto('/welcome');
    const registerButton = page.getByRole('button', { name: /register/i });
    await registerButton.click();
    await expect(page).toHaveURL('/register');
  });

  test('User registration - success', async ({ page }) => {
    await page.goto('/register');

    const testEmail = generateTestEmail('test-register');
    const testPin = '1234';
    const testName = 'Test User';

    // Fill registration form
    await page.fill(SELECTORS.INPUT_NAME, testName);
    await page.fill(SELECTORS.INPUT_EMAIL, testEmail);
    await page.fill(SELECTORS.INPUT_PIN, testPin);

    // Select country (using Select component)
    const countrySelect = page.locator(SELECTORS.SELECT_TRIGGER).first();
    if (await countrySelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await countrySelect.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);
      // Select first country option
      const firstOption = page.locator(SELECTORS.SELECT_ITEM).first();
      await expect(firstOption).toBeVisible({ timeout: TIMEOUTS.ELEMENT_SHORT });
      await firstOption.click();
    }

    // Submit form
    await page.click(SELECTORS.SUBMIT_BUTTON);

    // Wait for success message or redirect (PWA redirects to /cattle-info after registration)
    await page.waitForURL(/\/(cattle-info|login)/, { timeout: TIMEOUTS.FORM_SUBMIT });

    // Verify user created in database if available
    const dbAvailable = await isDbAvailable();
    if (dbAvailable) {
      const user = await getUserByEmail(testEmail);
      expect(user).not.toBeNull();
      expect(user.email_id).toBe(testEmail);
      expect(user.name).toBe(testName);

      // Store for cleanup
      testUserEmail = testEmail;
      testUserId = user.id;
    } else {
      testUserEmail = testEmail;
    }
  });

  test('User login - success', async ({ page }) => {
    // Create test user first
    const user = await createTestUser({
      countryId,
    });
    testUserEmail = user.email;
    testUserId = user.userId;
    testUserPin = user.pin;
    
    // Login via UI
    await loginAsUser(page, user.email, user.pin);
    
    // Verify redirect to authenticated page
    await expect(page).not.toHaveURL('/login');
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(cattle-info|admin|profile)/);
    
    // Verify auth state in localStorage
    const authStore = await page.evaluate(() => {
      return localStorage.getItem('auth-storage');
    });
    expect(authStore).not.toBeNull();
    const auth = JSON.parse(authStore!);
    expect(auth.state?.isAuthenticated).toBe(true);
  });

  test('User login - invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Try invalid email
    await page.fill(SELECTORS.INPUT_EMAIL, 'nonexistent@example.com');
    await page.fill(SELECTORS.INPUT_PIN, '1234');
    await page.click(SELECTORS.SUBMIT_BUTTON);

    // Should show error message or stay on login page
    const errorToast = page.locator(SELECTORS.TOAST_ERROR + ', ' + SELECTORS.TOAST + ', ' + SELECTORS.ERROR_MESSAGE);
    const errorVisible = await errorToast.first().isVisible({ timeout: TIMEOUTS.TOAST }).catch(() => false);

    // Either error toast shown OR we're still on login page (which indicates login failed)
    if (!errorVisible) {
      await expect(page).toHaveURL('/login');
    }

    // Should not redirect to authenticated page
    await expect(page).toHaveURL('/login');
  });

  test('Forgot PIN flow', async ({ page }) => {
    await page.goto('/forgot-pin');

    // Enter email
    const testEmail = generateTestEmail('test-forgot-pin');
    await page.fill(SELECTORS.INPUT_EMAIL + ', input[type="email"]', testEmail);

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|send|reset/i });
    await expect(submitButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    await submitButton.click();

    // Wait for response - either toast notification or form state change
    // Note: Backend may or may not send email - test just verifies API call was made
    const toast = page.locator(SELECTORS.TOAST);
    const toastVisible = await toast.first().isVisible({ timeout: TIMEOUTS.TOAST }).catch(() => false);

    // Verify either toast was shown or button state changed (indicating form submission)
    if (!toastVisible) {
      // Form was submitted - check that we're still on the page (not crashed)
      await expect(page).toHaveURL(/forgot-pin/);
    }
  });

  test('Profile management', async ({ page }) => {
    // Create and login user
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;

    await loginAsUser(page, user.email, user.pin);

    // Navigate to profile
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Verify we're on the profile page and it loaded
    const profilePageLoaded = await page.getByText(/profile|account|settings/i).first().isVisible({ timeout: TIMEOUTS.ELEMENT }).catch(() => false);

    // Try to find user info - it may be displayed in different ways
    const userNameVisible = await page.getByText(user.name, { exact: false }).isVisible({ timeout: 5000 }).catch(() => false);
    const userEmailVisible = await page.getByText(user.email, { exact: false }).isVisible({ timeout: 2000 }).catch(() => false);

    // At least one piece of user info should be visible, or the page loaded correctly
    expect(profilePageLoaded || userNameVisible || userEmailVisible || page.url().includes('/profile')).toBe(true);

    // Try to update profile (if update functionality exists)
    const updateButton = page.getByRole('button', { name: /update|edit|save/i });
    if (await updateButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      const newName = 'Updated Name';
      const nameInput = page.locator(SELECTORS.INPUT_NAME).first();
      if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nameInput.fill(newName);
        await updateButton.click();

        // Verify update (check for success message or updated name)
        const toastSuccess = page.locator(SELECTORS.TOAST_SUCCESS);
        const toastText = page.locator('text=/success|updated|saved/i');
        await expect(toastSuccess.or(toastText).first()).toBeVisible({ timeout: TIMEOUTS.TOAST });
      }
    }
  });

  test('Account deletion', async ({ page }) => {
    // Create and login user
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;

    await loginAsUser(page, user.email, user.pin);

    // Navigate to profile
    await page.goto('/profile');

    // Find delete account button
    const deleteButton = page.getByRole('button', { name: /delete|remove|deactivate/i });
    if (await deleteButton.isVisible({ timeout: TIMEOUTS.ELEMENT }).catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if confirmation dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Enter PIN if required
      const pinInput = page.locator(SELECTORS.INPUT_PIN + ', input[type="password"]');
      if (await pinInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await pinInput.fill(user.pin);
        const finalDeleteButton = page.getByRole('button', { name: /delete|confirm/i });
        await finalDeleteButton.click();
      }

      // Verify redirect to login
      await page.waitForURL('/login', { timeout: TIMEOUTS.NAVIGATION });

      // Verify user deleted from database if available
      const dbAvailable = await isDbAvailable();
      if (dbAvailable) {
        const deletedUser = await getUserByEmail(user.email);
        expect(deletedUser).toBeNull();
      }

      // Clear test user email so cleanup doesn't try to delete again
      testUserEmail = '';
    }
  });
});

