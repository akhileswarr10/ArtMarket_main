import { test, expect } from '@playwright/test';

test.describe('Security & Access Control', () => {
  test('unauthenticated users should be redirected to login', async ({ page }) => {
    const protectedRoutes = [
      '/dashboard',
      '/onboard',
      '/artist/dashboard',
      '/artist/upload',
      '/buyer/dashboard',
      '/buyer/favorites',
      '/admin/dashboard'
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });

  test('public routes should be accessible', async ({ page }) => {
    const publicRoutes = [
      '/',
      '/login',
      '/register',
      '/artworks'
    ];

    for (const route of publicRoutes) {
      await page.goto(route);
      // Ensure we didn't redirect to login if not already there
      if (route !== '/login') {
        expect(page.url()).not.toContain('login');
      }
    }
  });
});
