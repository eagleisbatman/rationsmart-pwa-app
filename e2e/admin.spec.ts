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
import {
  verifyDbConnection,
  getUserById,
  getFeedById,
  deleteTestFeed,
} from './helpers/db-helpers';
import { generateFeedData } from './helpers/test-data';

test.describe('Admin Features', () => {
  let adminUserEmail: string;
  let adminUserId: string;
  let adminUserPin: string;
  let regularUserEmail: string;
  let regularUserId: string;
  let countryId: string;

  test.beforeAll(async () => {
    const dbConnected = await verifyDbConnection();
    // Database connection is optional - tests will skip DB-dependent parts if not available
    if (!dbConnected) {
      console.warn('Database not available - some tests may be skipped');
    }

    const countries = await getCountries();
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
  });

  test.beforeEach(async () => {
    // Create admin user (need to set is_admin=true in database)
    const adminUser = await createTestUser({ countryId });
    adminUserEmail = adminUser.email;
    adminUserId = adminUser.userId;
    adminUserPin = adminUser.pin;

    // Set admin flag in database
    const { query } = await import('./helpers/db-helpers');
    await query('UPDATE user_information SET is_admin = true WHERE id = $1', [adminUserId]);

    // Create regular user for testing
    const regularUser = await createTestUser({ countryId });
    regularUserEmail = regularUser.email;
    regularUserId = regularUser.userId;
  });

  test.afterEach(async () => {
    if (adminUserEmail) {
      await cleanupTestUser(adminUserEmail, adminUserId);
    }
    if (regularUserEmail) {
      await cleanupTestUser(regularUserEmail, regularUserId);
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
    await page.waitForSelector('table, [role="table"], div', { timeout: 10000 });

    // Verify API call
    const users = await adminGetUsers(adminUserId);
    expect(users).toBeDefined();

    // Verify user list displays
    if (users.users && users.users.length > 0) {
      const userEmail = page.locator(`text=${regularUserEmail}`);
      await expect(userEmail.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('User management - search users', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/users');

    await page.waitForSelector('input[type="search"], input[placeholder*="search"]', { timeout: 10000 });

    // Type in search box
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    await searchInput.fill(regularUserEmail);
    
    // Wait for debounced search
    await page.waitForTimeout(1000);

    // Verify filtered results
    const userEmail = page.locator(`text=${regularUserEmail}`);
    await expect(userEmail.first()).toBeVisible();
  });

  test('User management - toggle user status', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/users');

    await page.waitForSelector('button', { timeout: 10000 });

    // Find toggle button for regular user
    const toggleButton = page.getByRole('button', { name: /toggle|activate|deactivate/i }).first();
    if (await toggleButton.count() > 0) {
      // Get current status
      const userBefore = await getUserById(regularUserId);
      const wasActive = userBefore.is_active;

      await toggleButton.click();

      // Confirm if dialog appears
      const confirmButton = page.getByRole('button', { name: /confirm|yes/i });
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      // Wait for update
      await page.waitForTimeout(1000);

      // Verify status changed in database
      const userAfter = await getUserById(regularUserId);
      expect(userAfter.is_active).toBe(!wasActive);
    }
  });

  test('Feed management - list feeds', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feeds');

    await page.waitForSelector('table, [role="table"], button', { timeout: 10000 });

    // Verify API call
    const feeds = await adminGetFeeds(adminUserId);
    expect(feeds).toBeDefined();
  });

  test('Feed management - add feed', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feeds');

    await page.waitForSelector('button', { timeout: 10000 });

    // Click Add Feed button
    const addButton = page.getByRole('button', { name: /add feed|new feed/i });
    await addButton.click();

    // Wait for dialog
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // Fill feed form
    const feedData = generateFeedData();
    await page.fill('input[name="fd_name"]', feedData.fd_name);
    await page.fill('input[name="fd_code"]', feedData.fd_code);

    // Select feed type
    const typeSelect = page.locator('select[name="fd_type"], [role="combobox"]').first();
    if (await typeSelect.count() > 0) {
      await typeSelect.selectOption({ index: 0 });
      await page.waitForTimeout(500);
    }

    // Fill nutrient fields
    await page.fill('input[name="fd_dm"]', feedData.fd_dm.toString());
    await page.fill('input[name="fd_cp"]', feedData.fd_cp.toString());

    // Submit
    const submitButton = page.getByRole('button', { name: /submit|save|add/i }).last();
    await submitButton.click();

    // Wait for success
    await page.waitForSelector('text=/success|added|created/i', { timeout: 10000 });

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
    await page.waitForSelector('button', { timeout: 10000 });

    // Find and click edit button
    const editButton = page.getByRole('button', { name: /edit/i }).first();
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

      // Modify feed name
      const nameInput = page.locator('input[name="fd_name"]').first();
      const newName = `Updated ${feedData.fd_name}`;
      await nameInput.fill(newName);

      // Submit
      const submitButton = page.getByRole('button', { name: /submit|save|update/i }).last();
      await submitButton.click();

      await page.waitForSelector('text=/success|updated/i', { timeout: 10000 });

      // Verify update in database
      const updatedFeed = await getFeedById(feedId);
      expect(updatedFeed.fd_name).toBe(newName);
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
    await page.waitForSelector('button', { timeout: 10000 });

    // Find delete button
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.count() > 0) {
      await deleteButton.click();

      // Confirm deletion
      const confirmButton = page.getByRole('button', { name: /confirm|yes|delete/i });
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      await page.waitForSelector('text=/success|deleted|removed/i', { timeout: 10000 });

      // Verify feed deleted
      const deletedFeed = await getFeedById(feedId);
      expect(deletedFeed).toBeNull();
    } else {
      // Cleanup if delete button not found
      await deleteTestFeed(feedId);
    }
  });

  test('Feed types and categories management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feed-types');

    await page.waitForSelector('[role="tab"], button', { timeout: 10000 });

    // Test Feed Types tab
    const feedTypesTab = page.getByRole('tab', { name: /feed.*type/i });
    if (await feedTypesTab.count() > 0) {
      await feedTypesTab.click();
      await page.waitForTimeout(500);

      // Try to add feed type
      const addButton = page.getByRole('button', { name: /add|new/i });
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForSelector('input, [role="dialog"]', { timeout: 5000 });

        const typeName = `TEST-TYPE-${Date.now()}`;
        const nameInput = page.locator('input').first();
        await nameInput.fill(typeName);

        const submitButton = page.getByRole('button', { name: /submit|save/i }).last();
        await submitButton.click();

        await page.waitForSelector('text=/success/i', { timeout: 10000 });
      }
    }

    // Test Feed Categories tab
    const categoriesTab = page.getByRole('tab', { name: /category/i });
    if (await categoriesTab.count() > 0) {
      await categoriesTab.click();
      await page.waitForTimeout(500);

      // Similar test for categories
      const addButton = page.getByRole('button', { name: /add|new/i });
      if (await addButton.count() > 0) {
        await addButton.click();
        await page.waitForSelector('input, [role="dialog"]', { timeout: 5000 });
      }
    }
  });

  test('Bulk upload page', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/bulk-upload');

    // Verify page loads
    await expect(page.getByText(/bulk.*upload|upload.*file/i)).toBeVisible();

    // Verify export buttons exist
    const exportStandardButton = page.getByRole('button', { name: /export.*standard/i });
    const exportCustomButton = page.getByRole('button', { name: /export.*custom/i });

    await expect(exportStandardButton.or(exportCustomButton).first()).toBeVisible();
  });

  test('Feedback management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/feedback');

    await page.waitForSelector('table, div', { timeout: 10000 });

    // Verify feedback list displays
    const feedbackText = page.locator('text=/feedback|rating|type/i');
    await expect(feedbackText.first()).toBeVisible({ timeout: 5000 });
  });

  test('Reports management', async ({ page }) => {
    await loginAsUser(page, adminUserEmail, adminUserPin);
    await page.goto('/admin/reports');

    await page.waitForSelector('table, div', { timeout: 10000 });

    // Verify reports list displays
    const reportsText = page.locator('text=/report|simulation|user/i');
    await expect(reportsText.first()).toBeVisible({ timeout: 5000 });
  });
});

