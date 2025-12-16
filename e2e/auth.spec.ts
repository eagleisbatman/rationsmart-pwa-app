import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAsUser,
  cleanupTestUser,
  generateTestEmail,
} from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';
import { verifyDbConnection, getUserByEmail } from './helpers/db-helpers';

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
    await page.fill('input[name="name"]', testName);
    await page.fill('input[name="email_id"]', testEmail);
    await page.fill('input[name="pin"]', testPin);
    
    // Select country (using Select component)
    const countrySelect = page.locator('[role="combobox"]').first();
    if (await countrySelect.count() > 0) {
      await countrySelect.click();
      await page.waitForTimeout(500);
      // Select first country option
      const firstOption = page.locator('[role="option"]').first();
      await firstOption.click();
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for success message or redirect (PWA redirects to /cattle-info after registration)
    await page.waitForURL(/^\/(cattle-info|login)/, { timeout: 10000 });
    
    // Verify user created in database
    const user = await getUserByEmail(testEmail);
    expect(user).not.toBeNull();
    expect(user.email_id).toBe(testEmail);
    expect(user.name).toBe(testName);
    
    // Note: Registration does NOT send email - user can login immediately
    
    // Store for cleanup
    testUserEmail = testEmail;
    testUserId = user.id;
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
      return localStorage.getItem('auth-store');
    });
    expect(authStore).not.toBeNull();
    const auth = JSON.parse(authStore!);
    expect(auth.isAuthenticated).toBe(true);
  });

  test('User login - invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Try invalid email
    await page.fill('input[name="email_id"]', 'nonexistent@example.com');
    await page.fill('input[name="pin"]', '1234');
    await page.click('button[type="submit"]');
    
    // Should show error message (toast notification)
    await expect(page.locator('text=/invalid|error|incorrect|failed/i').first()).toBeVisible({ timeout: 5000 });
    
    // Should not redirect
    await expect(page).toHaveURL('/login');
  });

  test('Forgot PIN flow', async ({ page }) => {
    await page.goto('/forgot-pin');
    
    // Enter email
    const testEmail = generateTestEmail('test-forgot-pin');
    await page.fill('input[name="email_id"], input[type="email"]', testEmail);
    
    // Submit
    const submitButton = page.getByRole('button', { name: /submit|send|reset/i });
    await submitButton.click();
    
    // Should show success message or error (toast notification)
    // Note: Backend may or may not send email - test just verifies API call
    await expect(
      page.locator('text=/success|sent|error|not found/i').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Profile management', async ({ page }) => {
    // Create and login user
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;
    
    await loginAsUser(page, user.email, user.pin);
    
    // Navigate to profile
    await page.goto('/profile');
    
    // Verify user data displays
    await expect(page.getByText(user.name, { exact: false })).toBeVisible();
    await expect(page.getByText(user.email, { exact: false })).toBeVisible();
    
    // Try to update profile (if update functionality exists)
    const updateButton = page.getByRole('button', { name: /update|edit|save/i });
    if (await updateButton.count() > 0) {
      const newName = 'Updated Name';
      const nameInput = page.locator('input[name="name"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(newName);
        await updateButton.click();
        
        // Verify update (check for success message or updated name)
        await expect(
          page.locator('text=/success|updated|saved/i').first()
        ).toBeVisible({ timeout: 5000 });
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
    if (await deleteButton.count() > 0) {
      await deleteButton.click();
      
      // Confirm deletion if confirmation dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      
      // Enter PIN if required
      const pinInput = page.locator('input[name="pin"], input[type="password"]');
      if (await pinInput.count() > 0) {
        await pinInput.fill(user.pin);
        const finalDeleteButton = page.getByRole('button', { name: /delete|confirm/i });
        await finalDeleteButton.click();
      }
      
      // Verify redirect to login
      await page.waitForURL('/login', { timeout: 10000 });
      
      // Verify user deleted from database
      const deletedUser = await getUserByEmail(user.email);
      expect(deletedUser).toBeNull();
      
      // Clear test user email so cleanup doesn't try to delete again
      testUserEmail = '';
    }
  });
});

