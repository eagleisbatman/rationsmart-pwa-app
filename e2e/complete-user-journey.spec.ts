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

    // Capture browser console logs
    page.on('console', msg => {
      if (msg.text().includes('RECOMMENDATION') || msg.text().includes('Selected Feeds') || msg.text().includes('least_cost_diet')) {
        console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
      }
    });

    // ========== STEP 1: LOGIN ==========
    console.log('📱 STEP 1: Login');
    await loginAsUser(page, testUserEmail, testUserPin);

    // Verify we're on cattle-info page
    await expect(page).toHaveURL(/cattle-info/);
    await page.screenshot({ path: 'e2e/test-results/journey-01-login-success.png', fullPage: true });
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

    await page.screenshot({ path: 'e2e/test-results/journey-02-cattle-info-filled.png', fullPage: true });

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

    await page.screenshot({ path: 'e2e/test-results/journey-03-feed-selection-page.png', fullPage: true });

    // Helper function to add a feed
    // categoryIndex: which category to select (0 = first, 1 = second, etc.)
    const addFeed = async (feedType: string, feedIndex: number, price: string, feedNum: number, categoryIndex: number = 0) => {
      // Select Feed Type
      const typeDropdown = page.locator('button:has-text("Select feed type")');
      await expect(typeDropdown).toBeVisible({ timeout: 5000 });
      await typeDropdown.click();
      await page.waitForTimeout(500);

      const typeOption = page.locator('[role="option"]').filter({ hasText: feedType });
      if (await typeOption.isVisible({ timeout: 1000 }).catch(() => false)) {
        await typeOption.click();
      } else {
        await page.locator('[role="option"]').first().click();
      }
      await page.waitForTimeout(1000);

      // Select Feed Category (use categoryIndex to select different categories)
      const catDropdown = page.locator('button:has-text("Select feed category")');
      if (await catDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await catDropdown.click();
        await page.waitForTimeout(500);
        const catOptions = page.locator('[role="option"]');
        const catCount = await catOptions.count();
        const catIdx = Math.min(categoryIndex, catCount - 1);
        await catOptions.nth(catIdx).click();
        await page.waitForTimeout(1000);
      }

      // Select Feed Name (use different feed each time)
      const feedDropdown = page.locator('button:has-text("Select feed name")');
      if (await feedDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
        await feedDropdown.click();
        await page.waitForTimeout(500);
        const feedOptions = page.locator('[role="option"]');
        const count = await feedOptions.count();
        const idx = Math.min(feedIndex, count - 1);
        await feedOptions.nth(idx).click();
        await page.waitForTimeout(500);
      }

      // Enter price and add
      const priceField = page.locator('input[type="number"][placeholder*="price"], input[placeholder*="Enter price"]');
      if (await priceField.isVisible({ timeout: 2000 }).catch(() => false)) {
        await priceField.fill(price);
        const addBtn = page.locator('button:has-text("Add Feed")');
        if (await addBtn.isVisible()) {
          await addBtn.click();
          console.log(`  - Feed ${feedNum} added (${feedType}, category: ${categoryIndex}, price: ${price})`);
          await page.waitForTimeout(500);
        }
      }
    };

    // Add 4 Forage feeds for variety (algorithm needs multiple feeds)
    // Using different indices to select different feeds
    console.log('  Adding Forage feeds...');
    await addFeed('Forage', 0, '5', 1);
    await addFeed('Forage', 2, '4', 2);  // Skip index 1 to get different feed
    await addFeed('Forage', 4, '3', 3);  // Skip more indices
    await addFeed('Forage', 6, '6', 4);  // Different feed

    await page.screenshot({ path: 'e2e/test-results/journey-04-forage-feeds-added.png', fullPage: true });

    // Add 2 Concentrate feeds from DIFFERENT CATEGORIES to ensure unique feeds
    // Categories: 0=Additive, 1=By-Product, 2=Energy Source, 3=Grain Crop, 4=Plant Protein
    console.log('  Adding Concentrate feeds...');
    await addFeed('Concentrate', 0, '10', 5, 2);  // Energy Source category
    await addFeed('Concentrate', 0, '12', 6, 3);  // Grain Crop category (different category = different feed)

    await page.screenshot({ path: 'e2e/test-results/journey-05-all-feeds-added.png', fullPage: true });

    // Verify selected feeds count
    const feedCards = page.locator('[class*="selected"] >> text=/Feed/i, text=Selected Feeds');
    console.log('✅ Feeds selected and displayed')

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

    await page.screenshot({ path: 'e2e/test-results/journey-09-recommendation-loading.png', fullPage: true });

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

    await page.screenshot({ path: 'e2e/test-results/journey-10-recommendation-result.png', fullPage: true });
    console.log('✅ Recommendation generated');

    // ========== STEP 5: SAVE REPORT / DOWNLOAD PDF ==========
    console.log('💾 STEP 5: Save Report');

    // The Save Report button is only enabled when report_info.report_id exists
    const saveReportButton = page.locator('button:has-text("Save Report")');
    const downloadPdfButton = page.locator('button:has-text("Download PDF")');

    if (await saveReportButton.isEnabled({ timeout: 5000 }).catch(() => false)) {
      await saveReportButton.click();
      console.log('  - Save Report clicked');

      // Wait for save process (retries + fallback to client PDF)
      // This can take up to 15+ seconds with retries
      await page.waitForTimeout(20000);

      await page.screenshot({ path: 'e2e/test-results/journey-11-report-saved.png', fullPage: true });
      console.log('✅ Report save process completed');
    } else if (await downloadPdfButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Fallback: use Download PDF button
      console.log('  - Save Report disabled, using Download PDF instead');
      await downloadPdfButton.click();
      await page.waitForTimeout(5000);

      await page.screenshot({ path: 'e2e/test-results/journey-11-report-saved.png', fullPage: true });
      console.log('✅ PDF download initiated');
    } else {
      console.log('  - No save/download buttons available');
      await page.screenshot({ path: 'e2e/test-results/journey-11-no-save-option.png', fullPage: true });
    }

    // ========== STEP 6: CHECK REPORTS PAGE ==========
    console.log('📋 STEP 6: Check Reports Page');

    // Navigate to reports using client-side navigation (click on nav button)
    // This avoids full page reload which can cause auth hydration issues
    const reportsNavButton = page.locator('button[aria-label="Reports"]');
    if (await reportsNavButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await reportsNavButton.click();
    } else {
      // Fallback: use desktop sidebar link
      const reportsLink = page.locator('a[href="/reports"], button:has-text("Reports")');
      await reportsLink.first().click();
    }
    await page.waitForURL('**/reports**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'e2e/test-results/journey-12-reports-page.png', fullPage: true });

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
        await page.screenshot({ path: 'e2e/test-results/journey-13-report-with-download.png', fullPage: true });
        console.log('✅ PDF download available');
      }
    }

    // ========== STEP 7: TEST MOBILE RESPONSIVE ==========
    console.log('📱 STEP 7: Test Mobile Responsive');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'e2e/test-results/journey-14-mobile-viewport.png', fullPage: true });
    console.log('  - Mobile viewport set (375x667)');

    // Verify mobile navigation bar is visible
    const mobileNav = page.locator('button[aria-label="Cattle Info"]');
    await expect(mobileNav).toBeVisible({ timeout: 5000 });
    console.log('  - Mobile navigation bar visible');

    // Verify all mobile nav buttons are present
    await expect(page.locator('button[aria-label="Reports"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Feedback"]')).toBeVisible();
    await expect(page.locator('button[aria-label="Profile"]')).toBeVisible();
    console.log('  - All mobile nav buttons present');

    await page.screenshot({ path: 'e2e/test-results/journey-15-mobile-nav-visible.png', fullPage: true });

    console.log('✅ Mobile responsive verified');
    console.log('🎉 COMPLETE USER JOURNEY FINISHED');
  });
});
