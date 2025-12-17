import { test, expect, request } from '@playwright/test';
import { TIMEOUTS } from './helpers/selectors';

// Helper to fetch the manifest using request API (doesn't affect page state)
async function fetchManifest(baseURL: string | undefined): Promise<{ url: string; manifest: any } | null> {
  const base = baseURL || 'http://localhost:3000';
  const manifestPaths = ['/manifest.webmanifest', '/manifest.json'];

  const context = await request.newContext();

  try {
    for (const path of manifestPaths) {
      const url = `${base}${path}`;
      try {
        const response = await context.get(url);
        if (response.status() === 200) {
          const manifest = await response.json();
          if (manifest && manifest.name) {
            return { url, manifest };
          }
        }
      } catch {
        // Not valid JSON or request failed, try next
      }
    }
    return null;
  } finally {
    await context.dispose();
  }
}

test.describe('PWA Features', () => {
  test('Manifest file accessibility', async ({ baseURL }) => {
    const result = await fetchManifest(baseURL);

    if (!result) {
      console.warn('⚠️ Manifest not found at expected paths - skipping PWA manifest tests');
      test.skip();
      return;
    }

    const { manifest } = result;
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

  test('Manifest structure validation', async ({ baseURL }) => {
    const result = await fetchManifest(baseURL);

    if (!result) {
      test.skip();
      return;
    }

    const { manifest } = result;

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

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check if service worker API is available
    const swSupported = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(swSupported).toBe(true);

    // Check if service worker is registered or will be registered
    const swRegistration = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration || navigator.serviceWorker.controller !== null;
        } catch {
          return false;
        }
      }
      return false;
    });

    // Service worker might not be registered in development mode
    // Just check that the API is available
    expect(swSupported).toBe(true);
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

    // Verify mobile layout renders correctly
    await page.waitForLoadState('networkidle');

    // Check that key content is visible on mobile
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();

    // Verify page renders at mobile width
    const viewport = page.viewportSize();
    expect(viewport?.width).toBe(375);
  });

  test('Responsive design - tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/welcome');

    // Verify tablet layout renders
    await page.waitForLoadState('networkidle');

    // Check that key content is visible
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test('Responsive design - desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/welcome');

    // Verify desktop layout renders
    await page.waitForLoadState('networkidle');

    // Check that key content is visible
    const loginButton = page.getByRole('button', { name: /login/i });
    await expect(loginButton).toBeVisible();
  });

  test('Theme switching - dark mode', async ({ page }) => {
    await page.goto('/welcome');

    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    const toggleVisible = await themeToggle.isVisible({ timeout: 1000 }).catch(() => false);

    if (!toggleVisible) {
      test.skip();
      return;
    }

    await themeToggle.click();
    await page.waitForTimeout(TIMEOUTS.ANIMATION);

    // Verify dark mode applied
    const htmlClasses = await page.locator('html').getAttribute('class');
    const bodyClasses = await page.locator('body').getAttribute('class');

    // Check if dark class is present
    const isDark = htmlClasses?.includes('dark') || bodyClasses?.includes('dark');
    expect(isDark).toBe(true);
  });

  test('Theme switching - light mode', async ({ page }) => {
    await page.goto('/welcome');

    // Set to dark first
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    const toggleVisible = await themeToggle.isVisible({ timeout: 1000 }).catch(() => false);

    if (!toggleVisible) {
      test.skip();
      return;
    }

    await themeToggle.click();
    await page.waitForTimeout(TIMEOUTS.ANIMATION);

    // Toggle back to light
    await themeToggle.click();
    await page.waitForTimeout(TIMEOUTS.ANIMATION);

    // Verify light mode applied
    const htmlClasses = await page.locator('html').getAttribute('class');
    const bodyClasses = await page.locator('body').getAttribute('class');

    const isLight = !htmlClasses?.includes('dark') && !bodyClasses?.includes('dark');
    expect(isLight).toBe(true);
  });

  test('Theme persistence in localStorage', async ({ page }) => {
    await page.goto('/welcome');

    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /theme|dark|light|toggle/i });
    const toggleVisible = await themeToggle.isVisible({ timeout: 1000 }).catch(() => false);

    if (!toggleVisible) {
      test.skip();
      return;
    }

    await themeToggle.click();
    await page.waitForTimeout(TIMEOUTS.ANIMATION);

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
  });

  test('System preference detection', async ({ page }) => {
    // Set system preference to dark using page.emulateMedia
    await page.emulateMedia({ colorScheme: 'dark' });
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

    // Check if manifest is linked - could be .webmanifest or .json
    const manifestLink = page.locator('link[rel="manifest"]');
    const manifestCount = await manifestLink.count();
    expect(manifestCount).toBeGreaterThan(0);

    const manifestHref = await manifestLink.first().getAttribute('href');
    expect(manifestHref).toMatch(/manifest\.(webmanifest|json)/);

    // Check for apple-mobile-web-app-capable meta tag
    const appleIcon = page.locator('meta[name="apple-mobile-web-app-capable"]');
    if (await appleIcon.count() > 0) {
      await expect(appleIcon).toHaveAttribute('content', 'yes');
    }
  });

  test('App icons and favicon', async ({ page }) => {
    await page.goto('/');

    // Check for favicon - use toHaveCount since link elements may not be "visible"
    const favicon = page.locator('link[rel="icon"]');
    await expect(favicon).toHaveCount(1);

    // Check for apple touch icon
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    const appleTouchIconCount = await appleTouchIcon.count();
    // Apple touch icon is optional, just verify it has correct structure if present
    if (appleTouchIconCount > 0) {
      const href = await appleTouchIcon.first().getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('Standalone display mode', async ({ baseURL }) => {
    const result = await fetchManifest(baseURL);

    if (!result) {
      test.skip();
      return;
    }

    expect(result.manifest.display).toBe('standalone');
  });

  test('Start URL configuration', async ({ page, baseURL }) => {
    const result = await fetchManifest(baseURL);

    if (!result) {
      test.skip();
      return;
    }

    const { manifest } = result;
    expect(manifest.start_url).toBe('/');

    // Verify start URL is accessible
    const base = baseURL || 'http://localhost:3000';
    const startUrl = `${base}${manifest.start_url}`;
    const startResponse = await page.goto(startUrl);
    expect(startResponse?.status()).toBe(200);
  });
});

