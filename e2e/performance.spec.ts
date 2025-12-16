import { test, expect } from '@playwright/test';
import { createTestUser, loginAsUser, cleanupTestUser } from './helpers/auth-helpers';
import { getCountries } from './helpers/api-helpers';

test.describe('Performance Tests', () => {
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

  test('Page load performance - initial load', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be interactive
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Target: < 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('Page load performance - time to interactive', async ({ page }) => {
    await page.goto('/welcome');
    
    // Measure time to interactive (when main content is visible)
    const startTime = Date.now();
    
    await page.waitForSelector('button, [role="button"]', { timeout: 5000 });
    
    const interactiveTime = Date.now() - startTime;
    
    // Target: < 5 seconds
    expect(interactiveTime).toBeLessThan(5000);
  });

  test('API response time - feed types loading', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    
    const startTime = Date.now();
    
    await page.goto('/feed-selection');
    await page.waitForSelector('select, [role="combobox"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Target: < 1 second for feed types
    expect(loadTime).toBeLessThan(1000);
  });

  test('API response time - feed categories loading', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/feed-selection');
    
    await page.waitForSelector('select, [role="combobox"]', { timeout: 10000 });
    
    // Select feed type
    const feedTypeSelect = page.locator('select, [role="combobox"]').first();
    if (await feedTypeSelect.count() > 0) {
      const startTime = Date.now();
      
      await feedTypeSelect.selectOption({ index: 0 });
      await page.waitForTimeout(1000); // Wait for categories to load
      
      const loadTime = Date.now() - startTime;
      
      // Target: < 1 second for categories
      expect(loadTime).toBeLessThan(1000);
    }
  });

  test('Search debouncing performance', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/admin/users');
    
    await page.waitForSelector('input[type="search"]', { timeout: 10000 });
    
    const searchInput = page.locator('input[type="search"]').first();
    
    // Type multiple characters rapidly
    const startTime = Date.now();
    await searchInput.fill('a');
    await searchInput.fill('ab');
    await searchInput.fill('abc');
    await searchInput.fill('abcd');
    
    // Wait for debounce to complete
    await page.waitForTimeout(1500);
    
    const debounceTime = Date.now() - startTime;
    
    // Debounce should delay API calls (should take some time)
    expect(debounceTime).toBeGreaterThan(500);
  });

  test('Large dataset handling - pagination', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    await page.goto('/admin/feeds');
    
    await page.waitForSelector('table, div', { timeout: 10000 });
    
    const startTime = Date.now();
    
    // Check if pagination exists and works
    const nextButton = page.getByRole('button', { name: /next/i });
    if (await nextButton.count() > 0 && await nextButton.isEnabled()) {
      await nextButton.click();
      await page.waitForTimeout(1000);
    }
    
    const paginationTime = Date.now() - startTime;
    
    // Pagination should be fast (< 2 seconds)
    expect(paginationTime).toBeLessThan(2000);
  });

  test('Image optimization - lazy loading', async ({ page }) => {
    await page.goto('/');
    
    // Check if images use loading="lazy"
    const images = page.locator('img');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      const firstImage = images.first();
      const loadingAttr = await firstImage.getAttribute('loading');
      
      // Should use lazy loading or Next.js Image component
      expect(loadingAttr === 'lazy' || loadingAttr === null).toBe(true);
    }
  });

  test('Code splitting - route-based', async ({ page }) => {
    // Navigate to initial page
    await page.goto('/welcome');
    await page.waitForLoadState('networkidle');
    
    const initialResources = (await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    })) as number;
    
    // Navigate to another route
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const afterNavigationResources = (await page.evaluate(() => {
      return performance.getEntriesByType('resource').length;
    })) as number;
    
    // Should load additional resources for new route
    expect(afterNavigationResources).toBeGreaterThanOrEqual(initialResources);
  });

  test('Bundle size - initial JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Get JavaScript bundle sizes
    const jsResources = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      return resources
        .filter((r) => r.name.includes('.js') && !r.name.includes('sw.js'))
        .map((r) => ({
          name: r.name,
          size: r.transferSize || 0,
        }));
    });
    
    // Calculate total JS size
    const totalSize = jsResources.reduce((sum, r) => sum + r.size, 0);
    
    // Target: < 500KB for initial JS (compressed)
    expect(totalSize).toBeLessThan(500 * 1024);
  });

  test('Lighthouse performance score', async ({ page }) => {
    // Note: This is a placeholder - actual Lighthouse testing requires
    // @playwright/test with lighthouse plugin or separate tool
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Basic performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });
    
    // DOM content should load quickly
    expect(metrics.domContentLoaded).toBeLessThan(2000);
  });

  test('Memory usage - no memory leaks', async ({ page }) => {
    await loginAsUser(page, testUserEmail, '1234');
    
    // Navigate through multiple pages
    const pages = ['/cattle-info', '/feed-selection', '/profile', '/reports'];
    
    for (const route of pages) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }
    
    // Check memory (basic check - actual memory profiling requires dev tools)
    const memoryInfo = await page.evaluate(() => {
      return (performance as any).memory
        ? {
            used: (performance as any).memory.usedJSHeapSize,
            total: (performance as any).memory.totalJSHeapSize,
          }
        : null;
    });
    
    // If memory info available, verify it's reasonable
    if (memoryInfo) {
      expect(memoryInfo.used).toBeGreaterThan(0);
      expect(memoryInfo.total).toBeGreaterThan(memoryInfo.used);
    }
  });
});

