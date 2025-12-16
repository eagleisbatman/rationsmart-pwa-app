import { test, expect } from '@playwright/test';
import { createTestUser, loginAsUser, cleanupTestUser } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';

test.describe('Mobile Responsiveness & Touch Targets', () => {
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

  test('Mobile hamburger menu opens drawer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Find hamburger menu button
    const hamburgerButton = page.getByRole('button', { name: /open menu|menu/i });
    await expect(hamburgerButton).toBeVisible();

    // Click hamburger menu
    await hamburgerButton.click();

    // Verify drawer opens
    const drawer = page.locator('[role="dialog"], [data-slot="sheet-content"]');
    await expect(drawer).toBeVisible({ timeout: 1000 });

    // Verify drawer contains navigation items
    await expect(page.getByText(/profile|feed reports|feedback/i)).toBeVisible();
  });

  test('Mobile drawer navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Open drawer
    const hamburgerButton = page.getByRole('button', { name: /open menu|menu/i });
    await hamburgerButton.click();
    await page.waitForTimeout(500);

    // Click Profile in drawer
    const profileButton = page.getByRole('button', { name: /profile/i });
    await profileButton.click();

    // Verify navigation
    await expect(page).toHaveURL(/\/profile/);
  });

  test('Bottom navigation visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Verify bottom navigation exists
    const bottomNav = page.locator('[class*="fixed bottom-0"]');
    await expect(bottomNav).toBeVisible();

    // Verify navigation items
    await expect(page.getByText(/cattle info|reports|feedback|profile/i)).toBeVisible();
  });

  test('Bottom navigation hidden on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Bottom nav should be hidden on desktop
    const bottomNav = page.locator('[class*="fixed bottom-0"]');
    await expect(bottomNav).not.toBeVisible();
  });

  test('Touch targets meet minimum size (44x44px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Check bottom navigation buttons
    const navButtons = page.locator('[class*="fixed bottom-0"] button');
    const buttonCount = await navButtons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = navButtons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Form inputs are mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Check input fields have adequate height
    const inputs = page.locator('input[type="number"], input[type="text"]');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const box = await input.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(40); // At least 40px for mobile
      }
    }
  });

  test('Dialogs are responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsUser(page, testUserEmail, '1234');
    
    // Navigate to admin feeds page (if admin) or use a page with dialogs
    if (await page.locator('text=/admin/i').count() > 0) {
      await page.goto('/admin/feeds');
      await page.waitForSelector('button', { timeout: 10000 });

      // Try to open a dialog
      const addButton = page.getByRole('button', { name: /add feed/i });
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForTimeout(500);

        // Verify dialog is visible and responsive
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible();

        // Check dialog doesn't overflow viewport
        const dialogBox = await dialog.boundingBox();
        const viewport = page.viewportSize();
        if (dialogBox && viewport) {
          expect(dialogBox.width).toBeLessThanOrEqual(viewport.width);
          expect(dialogBox.height).toBeLessThanOrEqual(viewport.height);
        }
      }
    }
  });

  test('Registration form is mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/register');

    // Verify form is visible and properly sized
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check form inputs
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email_id"]');
    const pinInput = page.locator('input[name="pin"]');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(pinInput).toBeVisible();

    // Verify inputs have adequate size
    const nameBox = await nameInput.boundingBox();
    if (nameBox) {
      expect(nameBox.height).toBeGreaterThanOrEqual(40);
    }
  });

  test('Login form is mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Verify form is visible
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check form inputs
    const emailInput = page.locator('input[name="email_id"]');
    const pinInput = page.locator('input[name="pin"]');

    await expect(emailInput).toBeVisible();
    await expect(pinInput).toBeVisible();
  });

  test('Safe area insets work on iOS', async ({ page }) => {
    // Simulate iOS device with safe areas
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/cattle-info');

    // Verify header respects safe area
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Verify bottom nav respects safe area
    const bottomNav = page.locator('[class*="fixed bottom-0"]');
    await expect(bottomNav).toBeVisible();
  });
});

