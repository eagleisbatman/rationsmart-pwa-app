import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAsUser,
  cleanupTestUser,
} from './helpers/auth-helpers';
import {
  adminGetUsers,
  adminToggleUserStatus,
  adminGetFeeds,
  adminAddFeed,
  adminUpdateFeed,
  adminDeleteFeed,
  getCountries,
} from './helpers/api-helpers';
import { generateFeedData } from './helpers/test-data';
import { SELECTORS, TIMEOUTS } from './helpers/selectors';

/**
 * Admin tests require a pre-existing admin account.
 * Set these environment variables to run admin tests:
 *   ADMIN_EMAIL - Admin user email
 *   ADMIN_PIN - Admin user PIN
 *   ADMIN_USER_ID - Admin user ID (for API calls)
 *
 * Without these, admin tests will be skipped.
 */
test.describe('Admin Features', () => {
  let adminUserEmail: string;
  let adminUserId: string;
  let adminUserPin: string;
  let regularUserEmail: string;
  let regularUserId: string;
  let countryId: string;
  let adminAvailable = false;

  test.beforeAll(async () => {
    // Check for pre-existing admin credentials in environment
    adminUserEmail = process.env.ADMIN_EMAIL || '';
    adminUserPin = process.env.ADMIN_PIN || '';
    adminUserId = process.env.ADMIN_USER_ID || '';

    if (adminUserEmail && adminUserPin && adminUserId) {
      adminAvailable = true;
      console.log('✅ Admin credentials found - admin tests will run');
    } else {
      console.warn('⚠️ Admin tests require ADMIN_EMAIL, ADMIN_PIN, and ADMIN_USER_ID environment variables');
      console.warn('   These tests will be skipped. To run them, set up an admin account and provide credentials.');
    }

    // Get country for creating test users
    const countries = await getCountries();
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test.beforeEach(async ({}, testInfo) => {
    // Skip if admin credentials not available
    if (!adminAvailable) {
      testInfo.skip();
      return;
    }

    // Create a regular user for testing (this doesn't require admin)
    const regularUser = await createTestUser({ countryId });
    regularUserEmail = regularUser.email;
    regularUserId = regularUser.userId;
  });

  test.afterEach(async () => {
    // Only cleanup regular users we created (don't touch admin account)
    if (regularUserEmail) {
      // Skip cleanup if we don't have a way to delete users
      try {
        await cleanupTestUser(regularUserEmail, regularUserId);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  test('Admin dashboard access', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin');

    // Verify admin menu displays
    await expect(page.getByText(/users|feeds|feedback|reports/i)).toBeVisible();
    
    // Verify admin navigation links
    const usersLink = page.getByRole('link', { name: /users/i });
    const feedsLink = page.getByRole('link', { name: /feeds/i });
    
    await expect(usersLink.or(feedsLink).first()).toBeVisible();
  });

  test('User management - list users', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/users');

    // Wait for users to load
    await page.waitForSelector(SELECTORS.TABLE + ', div', { timeout: TIMEOUTS.ELEMENT });

    // Verify API call
    const users = await adminGetUsers(adminUserId);
    expect(users).toBeDefined();

    // Verify user list displays - always check for the created regular user
    const userEmail = page.locator(`text=${regularUserEmail}`);
    await expect(userEmail.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
  });

  test('User management - search users', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/users');

    await page.waitForSelector(SELECTORS.INPUT_SEARCH, { timeout: TIMEOUTS.ELEMENT });

    // Type in search box
    const searchInput = page.locator(SELECTORS.INPUT_SEARCH).first();
    await searchInput.fill(regularUserEmail);

    // Wait for debounced search
    await page.waitForTimeout(TIMEOUTS.SEARCH_DEBOUNCE);

    // Verify filtered results
    const userEmail = page.locator(`text=${regularUserEmail}`);
    await expect(userEmail.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
  });

  test('User management - toggle user status', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/users');

    await page.waitForSelector(SELECTORS.TOGGLE_BUTTON + ', button', { timeout: TIMEOUTS.ELEMENT });

    // Find toggle button for regular user
    const toggleButton = page.locator(SELECTORS.TOGGLE_BUTTON).first();
    await expect(toggleButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });

    // Check if DB is available for status verification
    const dbAvailable = await isDbAvailable();

    let wasActive = true;
    if (dbAvailable) {
      const userBefore = await getUserById(regularUserId);
      wasActive = userBefore?.is_active ?? true;
    }

    await toggleButton.click();

    // Confirm if dialog appears
    const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for toast or status update
    await page.waitForTimeout(TIMEOUTS.ANIMATION);
    const toast = page.locator(SELECTORS.TOAST);
    await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.TOAST });

    // Verify status changed in database if DB available
    if (dbAvailable) {
      const userAfter = await getUserById(regularUserId);
      expect(userAfter?.is_active).toBe(!wasActive);
    }
  });

  test('Feed management - list feeds', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feeds');

    await page.waitForSelector(SELECTORS.TABLE + ', button', { timeout: TIMEOUTS.ELEMENT });

    // Verify API call
    const feeds = await adminGetFeeds(adminUserId);
    expect(feeds).toBeDefined();

    // Verify table is visible
    const table = page.locator(SELECTORS.TABLE);
    await expect(table.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
  });

  test('Feed management - add feed', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feeds');

    await page.waitForSelector('button', { timeout: TIMEOUTS.ELEMENT });

    // Click Add Feed button
    const addButton = page.getByRole('button', { name: /add feed|new feed/i });
    await expect(addButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    await addButton.click();

    // Wait for dialog
    await page.waitForSelector(SELECTORS.DIALOG, { timeout: TIMEOUTS.ELEMENT_SHORT });

    // Fill feed form
    const feedData = generateFeedData();
    await page.fill('input[name="fd_name"]', feedData.fd_name);
    await page.fill('input[name="fd_code"]', feedData.fd_code);

    // Select feed type
    const typeSelect = page.locator(SELECTORS.SELECT_TRIGGER).first();
    if (await typeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await typeSelect.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);
      const firstOption = page.locator(SELECTORS.SELECT_ITEM).first();
      if (await firstOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await firstOption.click();
      }
    }

    // Fill nutrient fields
    await page.fill('input[name="fd_dm"]', feedData.fd_dm.toString());
    await page.fill('input[name="fd_cp"]', feedData.fd_cp.toString());

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|save|add/i }).last();
    await submitButton.click();

    // Wait for success toast
    const toast = page.locator(SELECTORS.TOAST_SUCCESS + ', text=/success|added|created/i');
    await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.TOAST });

    // Verify feed created via API
    const feeds = await adminGetFeeds(adminUserId, { search: feedData.fd_name });
    expect(feeds.feeds || feeds).toBeDefined();

    // Cleanup
    if (feeds.feeds && feeds.feeds.length > 0) {
      const createdFeed = feeds.feeds.find((f: any) => f.fd_name === feedData.fd_name);
      if (createdFeed) {
        await deleteTestFeed(createdFeed.id || createdFeed.feed_id);
      }
    }
  });

  test('Feed management - edit feed', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);

    // First create a feed via API
    const feedData = generateFeedData();
    const addResponse = await adminAddFeed(adminUserId, {
      ...feedData,
      fd_country_cd: 'IND',
    });

    const feedId = addResponse.feed_id || addResponse.id;
    expect(feedId).toBeDefined();

    await page.goto('/admin/feeds');
    await page.waitForSelector('button', { timeout: TIMEOUTS.ELEMENT });

    // Find and click edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    await expect(editButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    await editButton.click();
    await page.waitForSelector(SELECTORS.DIALOG, { timeout: TIMEOUTS.ELEMENT_SHORT });

    // Modify feed name
    const nameInput = page.locator('input[name="fd_name"]').first();
    const newName = `Updated ${feedData.fd_name}`;
    await nameInput.fill(newName);

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|save|update/i }).last();
    await submitButton.click();

    // Wait for success toast
    const toast = page.locator(SELECTORS.TOAST_SUCCESS + ', text=/success|updated/i');
    await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.TOAST });

    // Verify update in database if available
    const dbAvailable = await isDbAvailable();
    if (dbAvailable) {
      const updatedFeed = await getFeedById(feedId);
      expect(updatedFeed?.fd_name).toBe(newName);
    }

    // Cleanup
    await deleteTestFeed(feedId);
  });

  test('Feed management - delete feed', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);

    // Create feed via API
    const feedData = generateFeedData();
    const addResponse = await adminAddFeed(adminUserId, {
      ...feedData,
      fd_country_cd: 'IND',
    });
    const feedId = addResponse.feed_id || addResponse.id;

    await page.goto('/admin/feeds');
    await page.waitForSelector('button', { timeout: TIMEOUTS.ELEMENT });

    // Find delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    await expect(deleteButton).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    await deleteButton.click();

    // Confirm deletion if dialog appears
    const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Wait for success toast
    const toast = page.locator(SELECTORS.TOAST_SUCCESS + ', text=/success|deleted|removed/i');
    await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.TOAST });

    // Verify feed deleted in database if available
    const dbAvailable = await isDbAvailable();
    if (dbAvailable) {
      const deletedFeed = await getFeedById(feedId);
      expect(deletedFeed).toBeNull();
    }
  });

  test('Feed types and categories management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feed-types');

    await page.waitForSelector('[role="tab"], button', { timeout: TIMEOUTS.ELEMENT });

    // Test Feed Types tab
    const feedTypesTab = page.getByRole('tab', { name: /feed.*type/i });
    if (await feedTypesTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await feedTypesTab.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);

      // Try to add feed type
      const addButton = page.getByRole('button', { name: /add|new/i });
      if (await addButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await addButton.click();
        await page.waitForSelector('input, ' + SELECTORS.DIALOG, { timeout: TIMEOUTS.ELEMENT_SHORT });

        const typeName = `TEST-TYPE-${Date.now()}`;
        const nameInput = page.locator('input').first();
        await nameInput.fill(typeName);

        const submitButton = page.getByRole('button', { name: /submit|save/i }).last();
        await submitButton.click();

        const toast = page.locator(SELECTORS.TOAST_SUCCESS + ', text=/success/i');
        await expect(toast.first()).toBeVisible({ timeout: TIMEOUTS.TOAST });
      }
    }

    // Test Feed Categories tab
    const categoriesTab = page.getByRole('tab', { name: /category/i });
    if (await categoriesTab.isVisible({ timeout: 1000 }).catch(() => false)) {
      await categoriesTab.click();
      await page.waitForTimeout(TIMEOUTS.ANIMATION);

      // Verify categories tab content loads
      const content = page.locator(SELECTORS.TABLE + ', button');
      await expect(content.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
    }
  });

  test('Bulk upload page', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/bulk-upload');

    // Verify page loads
    await expect(page.getByText(/bulk.*upload|upload.*file/i)).toBeVisible({ timeout: TIMEOUTS.ELEMENT });

    // Verify export buttons exist
    const exportStandardButton = page.getByRole('button', { name: /export.*standard/i });
    const exportCustomButton = page.getByRole('button', { name: /export.*custom/i });

    await expect(exportStandardButton.or(exportCustomButton).first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT });
  });

  test('Feedback management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feedback');

    await page.waitForSelector(SELECTORS.TABLE + ', div', { timeout: TIMEOUTS.ELEMENT });

    // Verify feedback list displays
    const feedbackText = page.locator('text=/feedback|rating|type/i');
    await expect(feedbackText.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_SHORT });
  });

  test('Reports management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/reports');

    await page.waitForSelector(SELECTORS.TABLE + ', div', { timeout: TIMEOUTS.ELEMENT });

    // Verify reports list displays
    const reportsText = page.locator('text=/report|simulation|user/i');
    await expect(reportsText.first()).toBeVisible({ timeout: TIMEOUTS.ELEMENT_SHORT });
  });
});

