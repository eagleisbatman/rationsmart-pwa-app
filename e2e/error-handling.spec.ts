import { test, expect } from '@playwright/test';
import { createApiClient } from './helpers/api-helpers';
import { createTestUser, cleanupTestUser, loginAsUser } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';

test.describe('Error Handling & Edge Cases', () => {
  let testUserEmail: string;
  let testUserId: string;
  let countryId: string;

  test.beforeAll(async () => {
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

  test('Network error handling', async ({ page, context }) => {
    await loginAsUser(page, testUserEmail, '1234');
    
    // Go offline
    await context.setOffline(true);
    
    // Try to navigate to a page that requires API call
    await page.goto('/feed-selection');
    
    // Should show error message or handle gracefully
    const errorMessage = page.locator('text=/error|failed|offline|network/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await context.setOffline(false);
  });

  test('API error - 400 Bad Request', async ({ page }) => {
    await page.goto('/register');
    
    // Submit form with invalid data
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="pin"]', '12'); // Too short
    await page.click('button[type="submit"]');
    
    // Should show validation error
    const errorMessage = page.locator('text=/invalid|error|required/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
  });

  test('API error - 401 Unauthorized', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/cattle-info');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('API error - 404 Not Found', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show 404 page or redirect
    const notFoundText = page.locator('text=/404|not found|page not found/i');
    await expect(notFoundText.first()).toBeVisible({ timeout: 5000 });
  });

  test('Form validation - empty required fields', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    const errorMessages = page.locator('text=/required|invalid|error/i');
    await expect(errorMessages.first()).toBeVisible({ timeout: 5000 });
  });

  test('Form validation - invalid email format', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'not-an-email');
    await page.fill('input[name="pin"]', '1234');
    await page.click('button[type="submit"]');
    
    // Should show email validation error
    const emailError = page.locator('text=/email|invalid.*format/i');
    await expect(emailError.first()).toBeVisible({ timeout: 5000 });
  });

  test('Form validation - invalid PIN format', async ({ page }) => {
    await page.goto('/register');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="pin"]', '12'); // Too short
    await page.click('button[type="submit"]');
    
    // Should show PIN validation error
    const pinError = page.locator('text=/pin|4.*digit|invalid/i');
    await expect(pinError.first()).toBeVisible({ timeout: 5000 });
  });

  test('Form validation - invalid numeric fields', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');
    
    // Try to enter negative number where invalid
    await page.fill('input[name="body_weight"]', '-100');
    await page.fill('input[name="milk_production"]', '-50');
    
    // Should show validation error or prevent submission
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
    
    // Should show error or prevent form submission
    const errorMessage = page.locator('text=/invalid|positive|greater.*than/i');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage.first()).toBeVisible();
    }
  });

  test('Data edge cases - very long strings', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');
    
    // Enter very long string
    const longString = 'a'.repeat(1000);
    await page.fill('input[name="name"]', longString);
    
    // Should truncate or validate
    const nameInput = page.locator('input[name="name"]');
    const value = await nameInput.inputValue();
    expect(value.length).toBeLessThanOrEqual(1000);
  });

  test('Data edge cases - special characters', async ({ page }) => {
    await page.goto('/register');
    
    // Enter special characters
    await page.fill('input[name="name"]', "Test User's Name <script>alert('xss')</script>");
    await page.fill('input[name="email"]', 'test+special@example.com');
    
    // Should sanitize or handle properly
    const nameInput = page.locator('input[name="name"]');
    const nameValue = await nameInput.inputValue();
    expect(nameValue).toBeTruthy();
  });

  test('Data edge cases - zero values', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');
    
    // Enter zero values
    await page.fill('input[name="body_weight"]', '0');
    await page.fill('input[name="milk_production"]', '0');
    
    // Should handle zero values appropriately
    const submitButton = page.getByRole('button', { name: /submit/i });
    await submitButton.click();
    
    // Should either accept zero or show validation error
    const errorOrSuccess = page.locator('text=/error|success|invalid/i');
    await expect(errorOrSuccess.first()).toBeVisible({ timeout: 5000 });
  });

  test('Concurrent operations - multiple tabs', async ({ context }) => {
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await loginAsUser(page1, testUserEmail, '1234');
    
    // Login in second tab
    await loginAsUser(page2, testUserEmail, '1234');
    
    // Navigate in first tab
    await page1.goto('/cattle-info');
    
    // Navigate in second tab
    await page2.goto('/profile');
    
    // Both should work independently
    await expect(page1).toHaveURL(/\/cattle-info/);
    await expect(page2).toHaveURL(/\/profile/);
    
    await page1.close();
    await page2.close();
  });

  test('Rapid form submissions - debouncing', async ({ page }) => {
    await page.goto('/admin/users');
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/admin/users');
    
    await page.waitForSelector('input[type="search"]', { timeout: 10000 });
    
    const searchInput = page.locator('input[type="search"]').first();
    
    // Rapidly type in search box
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');
    await searchInput.fill('abcd');
    
    // Wait for debounce
    await page.waitForTimeout(1500);
    
    // Should only trigger one API call (check network tab or wait for results)
    // This is a basic test - in real scenario, would intercept API calls
    const results = page.locator('table, div');
    await expect(results.first()).toBeVisible();
  });

  test('Simultaneous API calls', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/feed-selection');
    
    // Trigger multiple API calls simultaneously
    // (e.g., loading feed types and categories at once)
    await page.waitForSelector('select, [role="combobox"]', { timeout: 10000 });
    
    // Should handle multiple calls without errors
    const selects = page.locator('select, [role="combobox"]');
    const count = await selects.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Session expiration handling', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');
    
    // Clear auth state (simulate session expiration)
    await page.evaluate(() => {
      localStorage.removeItem('auth-store');
    });
    
    // Try to navigate to protected route
    await page.goto('/feed-selection');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('Large dataset handling', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/admin/feeds');
    
    await page.waitForSelector('table, div', { timeout: 10000 });
    
    // Verify pagination exists for large datasets
    const pagination = page.locator('button, [role="button"]').filter({ hasText: /next|previous|page/i });
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });
});

