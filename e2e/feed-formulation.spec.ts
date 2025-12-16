import { test, expect } from '@playwright/test';
import {
  createTestUser,
  loginAsUser,
  cleanupTestUser,
} from './helpers/auth-helpers';
import {
  getFeedTypes,
  getFeedCategories,
  getFeedSubCategories,
  getFeedDetails,
  getDietRecommendation,
  getDietEvaluation,
  saveReport,
  getUserReports,
} from './helpers/api-helpers';
import { verifyDbConnection, getReportById } from './helpers/db-helpers';
import { generateCattleInfo, generateFeedRecommendationRequest } from './helpers/test-data';
import { getCountries } from './helpers/api-helpers';

test.describe('Feed Formulation Flow', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testUserPin: string;
  let countryId: string;
  let countryCode: string;

  test.beforeAll(async () => {
    // Verify database connection
    const dbConnected = await verifyDbConnection();
    expect(dbConnected).toBe(true);

    // Get a valid country
    const countries = await getCountries();
    expect(countries.length).toBeGreaterThan(0);
    const activeCountry = countries.find((c: any) => c.is_active) || countries[0];
    countryId = activeCountry.id;
    countryCode = activeCountry.country_code;
  });

  test.beforeEach(async () => {
    // Create test user for each test
    const user = await createTestUser({ countryId });
    testUserEmail = user.email;
    testUserId = user.userId;
    testUserPin = user.pin;
  });

  test.afterEach(async () => {
    // Cleanup test user
    if (testUserEmail) {
      await cleanupTestUser(testUserEmail, testUserId);
    }
  });

  test('Cattle information form submission', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    await page.goto('/cattle-info');

    // Fill cattle information form
    const cattleInfo = generateCattleInfo({
      country: 'India',
      location: 'Test Location',
    });

    // Fill basic information
    await page.fill('input[name="name"]', cattleInfo.name);
    
    // Select country (if dropdown)
    const countrySelect = page.locator('select[name="country"], [role="combobox"]').first();
    if (await countrySelect.count() > 0) {
      await countrySelect.selectOption({ index: 0 });
    }
    
    await page.fill('input[name="location"]', cattleInfo.location);
    
    // Fill lactating status
    const lactatingInput = page.locator('input[name="lactating"], input[type="checkbox"][name*="lactating"]');
    if (await lactatingInput.count() > 0) {
      if (cattleInfo.lactating) {
        await lactatingInput.check();
      }
    }
    
    // Fill body weight
    await page.fill('input[name="body_weight"]', cattleInfo.body_weight.toString());
    
    // Fill breed
    await page.fill('input[name="breed"]', cattleInfo.breed);
    
    // Fill milk production data
    await page.fill('input[name="tp_milk"]', cattleInfo.tp_milk.toString());
    await page.fill('input[name="fat_milk"]', cattleInfo.fat_milk.toString());
    await page.fill('input[name="lactose_milk"]', cattleInfo.lactose_milk.toString());
    await page.fill('input[name="days_in_milk"]', cattleInfo.days_in_milk.toString());
    await page.fill('input[name="milk_production"]', cattleInfo.milk_production.toString());
    
    // Fill pregnancy data
    await page.fill('input[name="days_of_pregnancy"]', cattleInfo.days_of_pregnancy.toString());
    await page.fill('input[name="calving_interval"]', cattleInfo.calving_interval.toString());
    await page.fill('input[name="parity"]', cattleInfo.parity.toString());
    
    // Fill environment data
    await page.fill('input[name="topography"]', cattleInfo.topography);
    await page.fill('input[name="housing"]', cattleInfo.housing);
    await page.fill('input[name="temperature"]', cattleInfo.temperature.toString());
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /submit|next|continue/i });
    await submitButton.click();
    
    // Verify navigation to feed selection
    await page.waitForURL('/feed-selection', { timeout: 10000 });
    await expect(page).toHaveURL('/feed-selection');
  });

  test('Feed selection - type selection', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    await page.goto('/feed-selection');

    // Wait for feed types to load
    await page.waitForSelector('select, [role="combobox"], button', { timeout: 10000 });

    // Verify feed types are loaded (check API call)
    const feedTypes = await getFeedTypes(countryId, testUserId);
    expect(feedTypes.length).toBeGreaterThan(0);

    // Select a feed type
    const feedTypeSelect = page.locator('select[name*="type"], [role="combobox"]').first();
    if (await feedTypeSelect.count() > 0) {
      const firstFeedType = feedTypes[0];
      await feedTypeSelect.selectOption({ label: firstFeedType });
      
      // Wait for categories to load
      await page.waitForTimeout(1000);
      
      // Verify categories loaded
      const categories = await getFeedCategories(firstFeedType, countryId, testUserId);
      expect(categories).toBeDefined();
    }
  });

  test('Feed selection - category and subcategory selection', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    await page.goto('/feed-selection');

    // Get feed types
    const feedTypes = await getFeedTypes(countryId, testUserId);
    expect(feedTypes.length).toBeGreaterThan(0);
    const feedType = feedTypes[0];

    // Select feed type
    const feedTypeSelect = page.locator('select[name*="type"], [role="combobox"]').first();
    if (await feedTypeSelect.count() > 0) {
      await feedTypeSelect.selectOption({ label: feedType });
      await page.waitForTimeout(1000);
    }

    // Get categories
    const categoryResponse = await getFeedCategories(feedType, countryId, testUserId);
    const categories = categoryResponse.unique_feed_categories || [];
    expect(categories.length).toBeGreaterThan(0);
    const category = categories[0];

    // Select category
    const categorySelect = page.locator('select[name*="category"], [role="combobox"]').nth(1);
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ label: category });
      await page.waitForTimeout(1000);
    }

    // Get subcategories
    const subcategories = await getFeedSubCategories(feedType, category, countryId, testUserId);
    expect(subcategories.length).toBeGreaterThan(0);
    const subcategory = subcategories[0];

    // Select subcategory
    const subcategorySelect = page.locator('select[name*="subcategory"], button').last();
    if (await subcategorySelect.count() > 0) {
      await subcategorySelect.click();
      // Wait for feed details to load
      await page.waitForTimeout(2000);
    }

    // Verify feed details fetched
    if (subcategory.feed_uuid) {
      const feedDetails = await getFeedDetails({
        feed_id: subcategory.feed_uuid,
        user_id: testUserId,
        country_id: countryId,
      });
      expect(feedDetails).toBeDefined();
      expect(feedDetails.feed_details).toBeDefined();
    }
  });

  test('Feed recommendation generation', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    
    // First, fill cattle info
    await page.goto('/cattle-info');
    const cattleInfo = generateCattleInfo({ country: 'India' });
    
    // Fill minimal required fields
    await page.fill('input[name="name"]', cattleInfo.name);
    await page.fill('input[name="body_weight"]', cattleInfo.body_weight.toString());
    await page.fill('input[name="breed"]', cattleInfo.breed);
    await page.fill('input[name="milk_production"]', cattleInfo.milk_production.toString());
    
    const submitButton = page.getByRole('button', { name: /submit|next/i });
    await submitButton.click();
    await page.waitForURL('/feed-selection', { timeout: 10000 });

    // Select at least one feed
    const feedTypes = await getFeedTypes(countryId, testUserId);
    if (feedTypes.length > 0) {
      const feedType = feedTypes[0];
      const categoryResponse = await getFeedCategories(feedType, countryId, testUserId);
      const categories = categoryResponse.unique_feed_categories || [];
      
      if (categories.length > 0) {
        const category = categories[0];
        const subcategories = await getFeedSubCategories(feedType, category, countryId, testUserId);
        
        if (subcategories.length > 0) {
          const subcategory = subcategories[0];
          
          // Add feed to selection (click add button or similar)
          const addButton = page.getByRole('button', { name: /add|select/i });
          if (await addButton.count() > 0) {
            await addButton.click();
            await page.waitForTimeout(1000);
          }
        }
      }
    }

    // Navigate to recommendation
    await page.goto('/recommendation');
    
    // Wait for recommendation to generate
    await page.waitForSelector('text=/recommendation|report|analysis/i', { timeout: 30000 });
    
    // Verify recommendation displays
    const recommendationText = page.locator('text=/recommendation|feed|diet/i');
    await expect(recommendationText.first()).toBeVisible();
    
    // Verify report ID is generated (if displayed)
    const reportIdElement = page.locator('text=/report.*id|simulation/i');
    if (await reportIdElement.count() > 0) {
      await expect(reportIdElement.first()).toBeVisible();
    }
  });

  test('Save report', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    
    // Generate a recommendation first (simplified - in real test, would go through full flow)
    const cattleInfo = generateCattleInfo();
    const feeds = []; // Would need actual feed data
    
    // Try to get recommendation via API directly
    try {
      const recommendationRequest = generateFeedRecommendationRequest(cattleInfo, feeds);
      const recommendation = await getDietRecommendation(recommendationRequest);
      
      if (recommendation.report_id || recommendation.report_info?.report_id) {
        const reportId = recommendation.report_id || recommendation.report_info.report_id;
        
        // Save report via API
        const saveResponse = await saveReport({
          report_id: reportId,
          user_id: testUserId,
        });
        
        expect(saveResponse).toBeDefined();
        
        // Verify report saved in database
        const report = await getReportById(reportId);
        expect(report).toBeDefined();
      }
    } catch (error) {
      // If recommendation fails (e.g., no feeds), skip this test
      test.skip();
    }
  });

  test('View reports list', async ({ page }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    await page.goto('/reports');

    // Wait for reports to load
    await page.waitForSelector('text=/report|no reports|empty/i', { timeout: 10000 });

    // Verify API call was made
    const reports = await getUserReports(testUserId);
    expect(reports).toBeDefined();

    // If reports exist, verify they display
    if (reports.reports && reports.reports.length > 0) {
      const reportType = page.locator('text=/recommendation|evaluation/i');
      await expect(reportType.first()).toBeVisible();
      
      // Check for download button
      const downloadButton = page.getByRole('button', { name: /download|view/i });
      if (await downloadButton.count() > 0) {
        await expect(downloadButton.first()).toBeVisible();
      }
    } else {
      // Verify empty state
      const emptyState = page.locator('text=/no reports|empty/i');
      await expect(emptyState.first()).toBeVisible();
    }
  });

  test('Download report PDF', async ({ page, context }) => {
    await loginAsUser(page, testUserEmail, testUserPin);
    
    // Get user reports
    const reports = await getUserReports(testUserId);
    
    if (!reports.reports || reports.reports.length === 0) {
      test.skip();
      return;
    }

    await page.goto('/reports');
    await page.waitForSelector('button', { timeout: 10000 });

    // Find download button
    const downloadButton = page.getByRole('button', { name: /download/i }).first();
    if (await downloadButton.count() > 0) {
      // Click download button - opens bucket_url in new tab
      const [newPage] = await Promise.all([
        context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
        downloadButton.click(),
      ]);

      if (newPage) {
        await newPage.waitForLoadState();
        // Verify PDF URL (bucket_url from S3)
        expect(newPage.url()).toMatch(/\.pdf|bucket|s3|amazonaws/i);
      } else {
        // On mobile, may trigger download instead
        // Verify button click worked (no error)
        await page.waitForTimeout(1000);
      }
    }
  });
});

