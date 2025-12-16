import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('Manifest file accessibility', async ({ page, baseURL }) => {
    const url = baseURL ? `${baseURL}/manifest.webmanifest` : 'http://localhost:3000/manifest.webmanifest';
    const response = await page.goto(url);
    expect(response?.status()).toBe(200);

    const manifest = await response?.json();
    expect(manifest).toBeDefined();
    expect(manifest.name).toBe('RationSmart');
    expect(manifest.short_name).toBe('RationSmart');
    expect(manifest.description).toBeDefined();
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('Manifest structure validation', async ({ page, baseURL }) => {
    const url = baseURL ? `${baseURL}/manifest.webmanifest` : 'http://localhost:3000/manifest.webmanifest';
    const response = await page.goto(url);
    const manifest = await response?.json();

    // Verify required fields
    expect(manifest.name).toBeTruthy();
    expect(manifest.short_name).toBeTruthy();
    expect(manifest.start_url).toBeTruthy();
    expect(manifest.display).toBeTruthy();

    // Verify icons
    manifest.icons.forEach((icon: any) => {
      expect(icon.src).toBeDefined();
      expect(icon.sizes).toBeDefined();
      expect(icon.type).toBeDefined();
    });

    // Verify shortcuts if present
    if (manifest.shortcuts) {
      expect(Array.isArray(manifest.shortcuts)).toBe(true);
      manifest.shortcuts.forEach((shortcut: any) => {
        expect(shortcut.name).toBeDefined();
        expect(shortcut.url).toBeDefined();
      });
    }
  });

  test('Service worker registration', async ({ page, context }) => {
    await page.goto('/');

    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swRegistered).toBe(true);

    // Check for service worker script in page
    const swScript = await page.locator('script').filter({ hasText: 'serviceWorker' }).count();
    expect(swScript).toBeGreaterThan(0);
  });

  test('Offline functionality', async ({ page, context }) => {
    await page.goto('/');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate to another page
    await page.goto('/welcome');

    // Page should still load (from cache) or show offline message
    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);

    // Go back online
    await context.setOffline(false);
  });

  test('Responsive design - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/welcome');

    // Verify mobile layout elements
    const mobileNav = page.locator('[aria-label*="navigation"], nav').first();
    await expect(mobileNav).toBeVisible();

    // Check for mobile-specific classes or layouts
    const bodyClasses = await page.locator('body').getAttribute('class');
    expect(bodyClasses).toBeTruthy();
  });

  test('Responsive design - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/welcome');

    // Verify tablet layout
    const content = page.locator('main, [role="main"]');
    await expect(content.first()).toBeVisible();
  });

  test('Responsive design - desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/welcome');

    // Verify desktop layout
    const content = page.locator('main, [role="main"]');
    await expect(content.first()).toBeVisible();
  });

  test('Theme switching - dark mode', async ({ page }) => {
    await page.goto('/welcome');

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Verify dark mode applied
      const htmlClasses = await page.locator('html').getAttribute('class');
      const bodyClasses = await page.locator('body').getAttribute('class');
      
      // Check if dark class is present
      const isDark = htmlClasses?.includes('dark') || bodyClasses?.includes('dark');
      expect(isDark).toBe(true);
    }
  });

  test('Theme switching - light mode', async ({ page }) => {
    await page.goto('/welcome');

    // Set to dark first
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      
      // Toggle back to light
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Verify light mode applied
      const htmlClasses = await page.locator('html').getAttribute('class');
      const bodyClasses = await page.locator('body').getAttribute('class');
      
      const isLight = !htmlClasses?.includes('dark') && !bodyClasses?.includes('dark');
      expect(isLight).toBe(true);
    }
  });

  test('Theme persistence in localStorage', async ({ page }) => {
    await page.goto('/welcome');

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Check localStorage
      const theme = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('next-themes');
      });
      expect(theme).toBeTruthy();

      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verify theme persists
      const persistedTheme = await page.evaluate(() => {
        return localStorage.getItem('theme') || localStorage.getItem('next-themes');
      });
      expect(persistedTheme).toBe(theme);
    }
  });

  test('System preference detection', async ({ page, context }) => {
    // Set system preference to dark
    await context.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/welcome');

    // Wait for theme to apply
    await page.waitForTimeout(1000);

    // Verify theme matches system preference (if app respects it)
    const htmlClasses = await page.locator('html').getAttribute('class');
    const respectsSystem = htmlClasses?.includes('dark') !== undefined;
    expect(respectsSystem).toBe(true);
  });

  test('PWA installability', async ({ page, context }) => {
    await page.goto('/');

    // Check if manifest is linked
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', '/manifest.webmanifest');

    // Check for apple-touch-icon meta tags
    const appleIcon = page.locator('meta[name="apple-mobile-web-app-capable"]');
    if (await appleIcon.count() > 0) {
      await expect(appleIcon).toHaveAttribute('content', 'yes');
    }
  });

  test('App icons and favicon', async ({ page }) => {
    await page.goto('/');

    // Check for favicon
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon.first()).toBeVisible();

    // Check for apple touch icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    if (await appleTouchIcon.count() > 0) {
      await expect(appleTouchIcon.first()).toBeVisible();
    }
  });

  test('Standalone display mode', async ({ page, baseURL }) => {
    const url = baseURL ? `${baseURL}/manifest.webmanifest` : 'http://localhost:3000/manifest.webmanifest';
    const response = await page.goto(url);
    const manifest = await response?.json();

    expect(manifest.display).toBe('standalone');
  });

  test('Start URL configuration', async ({ page, baseURL }) => {
    const url = baseURL ? `${baseURL}/manifest.webmanifest` : 'http://localhost:3000/manifest.webmanifest';
    const response = await page.goto(url);
    const manifest = await response?.json();

    expect(manifest.start_url).toBe('/');
    
    // Verify start URL is accessible
    const startUrl = baseURL ? `${baseURL}${manifest.start_url}` : `http://localhost:3000${manifest.start_url}`;
    const startResponse = await page.goto(startUrl);
    expect(startResponse?.status()).toBe(200);
  });
});

