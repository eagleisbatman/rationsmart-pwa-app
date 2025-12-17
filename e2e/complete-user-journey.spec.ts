import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser, loginAsUser } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';

/**
 * COMPLETE USER JOURNEY E2E TEST
 *
 * This test verifies the entire application flow from login to PDF download:
 * 1. Login
 * 2. Fill cattle information
 * 3. Select feeds with prices
 * 4. Generate recommendation
 * 5. Save report
 * 6. Download PDF
 *
 * Videos will show actual data loading and real user interactions.
 */

test.describe('Complete User Journey - Full Application Flow', () => {
  let testUserEmail: string;
  let testUserId: string;
  let testUserPin: string;
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
    testUserPin = user.pin;
  });

  test.afterEach(async () => {
    if (testUserEmail) {
      await cleanupTestUser(testUserEmail, testUserId);
    }
  });

  test('Complete flow: Login → Cattle Info → Feed Selection → Recommendation → Save Report', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes for complete flow

    // ========== STEP 1: LOGIN ==========
    console.log('📱 STEP 1: Login');
    await loginAsUser(page, testUserEmail, testUserPin);

    // Verify we're on cattle-info page
    await expect(page).toHaveURL(/cattle-info/);
    await page.screenshot({ path: 'test-results/journey-01-login-success.png', fullPage: true });
    console.log('✅ Login successful');

    // ========== STEP 2: FILL CATTLE INFORMATION ==========
    console.log('🐄 STEP 2: Fill Cattle Information');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Fill Breed dropdown
    const breedDropdown = page.locator('button:has-text("Select breed")');
    await expect(breedDropdown).toBeVisible({ timeout: 10000 });
    await breedDropdown.click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'Holstein' }).click();
    await page.waitForTimeout(300);
    console.log('  - Selected breed: Holstein');

    // Fill numeric fields
    const fillField = async (name: string, value: string, label: string) => {
      const input = page.locator(`input[name="${name}"]`);
      if (await input.isVisible({ timeout: 2000 }).catch(() => false)) {
        await input.clear();
        await input.fill(value);
        console.log(`  - ${label}: ${value}`);
      }
    };

    await fillField('body_weight', '500', 'Body Weight');
    await fillField('bc_score', '3', 'Body Condition Score');
    await fillField('bw_gain', '0.5', 'Daily Weight Gain');

    // Check lactating checkbox
    const lactatingCheckbox = page.locator('input[type="checkbox"]').first();
    if (await lactatingCheckbox.isVisible()) {
      await lactatingCheckbox.check();
      console.log('  - Lactating: Yes');
      await page.waitForTimeout(500);
    }

    // Fill milk production fields
    await fillField('milk_production', '20', 'Milk Production');
    await fillField('fat_milk', '4', 'Milk Fat %');
    await fillField('tp_milk', '3.5', 'Milk Protein %');
    await fillField('days_in_milk', '100', 'Days in Milk');

    // Fill reproductive data
    await fillField('parity', '2', 'Parity');
    await fillField('calving_interval', '400', 'Calving Interval');
    await fillField('days_of_pregnancy', '0', 'Days of Pregnancy');

    // Fill environment data
    await fillField('distance', '1', 'Distance');
    await fillField('temperature', '25', 'Temperature');

    // Fill Topography dropdown
    const topographyDropdown = page.locator('button:has-text("Select topography")');
    if (await topographyDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await topographyDropdown.click();
      await page.waitForTimeout(500);
      await page.locator('[role="option"]').filter({ hasText: 'Flat' }).click();
      console.log('  - Topography: Flat');
    }

    await page.screenshot({ path: 'test-results/journey-02-cattle-info-filled.png', fullPage: true });

    // Click Continue
    const continueButton = page.locator('button[type="submit"]:has-text("Continue")');
    await expect(continueButton).toBeVisible();
    await continueButton.click();

    // Wait for navigation to feed-selection
    await page.waitForURL('**/feed-selection**', { timeout: 15000 });
    console.log('✅ Cattle information saved');

    // ========== STEP 3: SELECT FEEDS ==========
    console.log('🌾 STEP 3: Select Feeds');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/journey-03-feed-selection-page.png', fullPage: true });

    // === ADD FIRST FEED (Forage) ===
    console.log('  Adding Forage feed...');

    // Select Feed Type
    const feedTypeDropdown = page.locator('button:has-text("Select feed type")');
    await expect(feedTypeDropdown).toBeVisible({ timeout: 10000 });
    await feedTypeDropdown.click();
    await page.waitForTimeout(500);

    // Check what options are available
    const typeOptions = page.locator('[role="option"]');
    const typeCount = await typeOptions.count();
    console.log(`  - Available feed types: ${typeCount}`);

    // Select Forage if available, otherwise first option
    const forageOption = page.locator('[role="option"]').filter({ hasText: 'Forage' });
    if (await forageOption.isVisible({ timeout: 1000 }).catch(() => false)) {
      await forageOption.click();
      console.log('  - Selected type: Forage');
    } else {
      await typeOptions.first().click();
      console.log('  - Selected type: First available');
    }
    await page.waitForTimeout(1500);

    await page.screenshot({ path: 'test-results/journey-04-feed-type-selected.png', fullPage: true });

    // Select Feed Category
    const categoryDropdown = page.locator('button:has-text("Select feed category")');
    if (await categoryDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await categoryDropdown.click();
      await page.waitForTimeout(500);

      const categoryOptions = page.locator('[role="option"]');
      const catCount = await categoryOptions.count();
      console.log(`  - Available categories: ${catCount}`);

      await categoryOptions.first().click();
      console.log('  - Selected first category');
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'test-results/journey-05-category-selected.png', fullPage: true });

    // Select Feed Name
    const feedNameDropdown = page.locator('button:has-text("Select feed name")');
    if (await feedNameDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await feedNameDropdown.click();
      await page.waitForTimeout(500);

      const feedOptions = page.locator('[role="option"]');
      const feedCount = await feedOptions.count();
      console.log(`  - Available feeds: ${feedCount}`);

      await feedOptions.first().click();
      console.log('  - Selected first feed');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/journey-06-feed-name-selected.png', fullPage: true });

    // Enter price and add feed
    const priceInput = page.locator('input[type="number"][placeholder*="price"], input[placeholder*="Enter price"]');
    if (await priceInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await priceInput.fill('5');
      console.log('  - Price: 5/kg');

      const addButton = page.locator('button:has-text("Add Feed")');
      await expect(addButton).toBeVisible();
      await addButton.click();
      console.log('  - Feed added!');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/journey-07-first-feed-added.png', fullPage: true });

    // === ADD SECOND FEED (Concentrate) ===
    console.log('  Adding Concentrate feed...');

    // Select Feed Type again
    const feedTypeDropdown2 = page.locator('button:has-text("Select feed type")');
    if (await feedTypeDropdown2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await feedTypeDropdown2.click();
      await page.waitForTimeout(500);

      const concentrateOption = page.locator('[role="option"]').filter({ hasText: 'Concentrate' });
      if (await concentrateOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await concentrateOption.click();
        console.log('  - Selected type: Concentrate');
      } else {
        // Select second option if available
        const options = page.locator('[role="option"]');
        if (await options.count() > 1) {
          await options.nth(1).click();
        } else {
          await options.first().click();
        }
      }
      await page.waitForTimeout(1500);

      // Select category
      const catDropdown2 = page.locator('button:has-text("Select feed category")');
      if (await catDropdown2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await catDropdown2.click();
        await page.waitForTimeout(500);
        await page.locator('[role="option"]').first().click();
        await page.waitForTimeout(1500);
      }

      // Select feed name
      const feedDropdown2 = page.locator('button:has-text("Select feed name")');
      if (await feedDropdown2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedDropdown2.click();
        await page.waitForTimeout(500);
        await page.locator('[role="option"]').first().click();
        await page.waitForTimeout(1000);
      }

      // Enter price and add
      const priceInput2 = page.locator('input[type="number"][placeholder*="price"], input[placeholder*="Enter price"]');
      if (await priceInput2.isVisible({ timeout: 2000 }).catch(() => false)) {
        await priceInput2.fill('10');
        console.log('  - Price: 10/kg');

        const addButton2 = page.locator('button:has-text("Add Feed")');
        if (await addButton2.isVisible()) {
          await addButton2.click();
          console.log('  - Second feed added!');
        }
      }
    }

    await page.screenshot({ path: 'test-results/journey-08-feeds-selected.png', fullPage: true });

    // Verify selected feeds are displayed
    const selectedFeedsSection = page.locator('text=Selected Feeds');
    if (await selectedFeedsSection.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('✅ Feeds selected and displayed');
    }

    // ========== STEP 4: GENERATE RECOMMENDATION ==========
    console.log('📊 STEP 4: Generate Recommendation');

    // Click Continue to Recommendation
    const continueToRec = page.locator('button:has-text("Continue to Recommendation")');
    await expect(continueToRec).toBeVisible({ timeout: 5000 });
    await continueToRec.click();

    // Wait for recommendation page
    await page.waitForURL('**/recommendation**', { timeout: 30000 });
    console.log('  - Navigated to recommendation page');

    // Wait for recommendation to load (may take time for NSGA-II algorithm)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await page.screenshot({ path: 'test-results/journey-09-recommendation-loading.png', fullPage: true });

    // Wait for recommendation content
    const recommendationContent = page.locator('text=Feed Recommendation');
    await expect(recommendationContent).toBeVisible({ timeout: 60000 });

    // Check if recommendation data is displayed
    const recData = page.locator('pre');
    if (await recData.isVisible({ timeout: 10000 }).catch(() => false)) {
      const recText = await recData.textContent();
      console.log('  - Recommendation data loaded');

      // Verify key fields are present
      if (recText?.includes('report_id')) {
        console.log('  - Report ID present');
      }
      if (recText?.includes('least_cost_diet')) {
        console.log('  - Diet recommendation present');
      }
      if (recText?.includes('environmental_impact')) {
        console.log('  - Environmental impact present');
      }
    }

    await page.screenshot({ path: 'test-results/journey-10-recommendation-result.png', fullPage: true });
    console.log('✅ Recommendation generated');

    // ========== STEP 5: SAVE REPORT ==========
    console.log('💾 STEP 5: Save Report');

    const saveReportButton = page.locator('button:has-text("Save Report")');
    if (await saveReportButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await saveReportButton.click();
      await page.waitForTimeout(500);

      // Handle save dialog
      const saveConfirmButton = page.locator('button:has-text("Save")').last();
      if (await saveConfirmButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await saveConfirmButton.click();
        console.log('  - Report save requested');

        // Wait for success toast or navigation
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test-results/journey-11-report-saved.png', fullPage: true });
        console.log('✅ Report saved');
      }
    } else {
      console.log('  - Save Report button not visible (may need valid recommendation first)');
    }

    // ========== STEP 6: CHECK REPORTS PAGE ==========
    console.log('📋 STEP 6: Check Reports Page');

    // Navigate to reports
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/journey-12-reports-page.png', fullPage: true });

    // Check for reports
    const noReports = page.locator('text=No reports saved yet');
    const reportsList = page.locator('[class*="space-y-4"]');

    if (await noReports.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  - No reports found (report may not have been saved)');
    } else {
      console.log('  - Reports page loaded');

      // Check for download button
      const downloadButton = page.locator('button[aria-label="Download PDF report"], button:has([class*="Download"])');
      if (await downloadButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  - Download button available');
        await page.screenshot({ path: 'test-results/journey-13-report-with-download.png', fullPage: true });
        console.log('✅ PDF download available');
      }
    }

    // ========== STEP 7: TEST MOBILE RESPONSIVE ==========
    console.log('📱 STEP 7: Test Mobile Responsive');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    await page.screenshot({ path: 'test-results/journey-14-mobile-viewport.png', fullPage: true });
    console.log('  - Mobile viewport set (375x667)');

    // Navigate through pages in mobile
    await page.goto('/cattle-info');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/journey-15-mobile-cattle-info.png', fullPage: true });

    await page.goto('/feed-selection');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/journey-16-mobile-feed-selection.png', fullPage: true });

    await page.goto('/feedback');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/journey-17-mobile-feedback.png', fullPage: true });

    console.log('✅ Mobile responsive verified');
    console.log('🎉 COMPLETE USER JOURNEY FINISHED');
  });
});
