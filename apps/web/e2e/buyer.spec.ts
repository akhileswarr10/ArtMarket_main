import { test, expect } from '@playwright/test';

test.describe('Buyer Flow', () => {
  const email = `test-buyer-${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'TestPassword123!';

  test('should register and browse gallery', async ({ page }) => {
    // 1. Sign Up
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Onboarding
    await expect(page).toHaveURL(/.*onboard/);
    await page.fill('input[placeholder*="Name"]', 'Test Buyer');
    await page.click('text=Become a Collector');

    // Dashboard
    await expect(page).toHaveURL(/.*buyer\/dashboard/);
    await expect(page.locator('h1')).toContainText('Discover Art');

    // Gallery
    await page.goto('/artworks');
    await expect(page.locator('h2')).toContainText('Discover Original Art');
  });

  test('should see empty favorites if none added', async ({ page }) => {
    // Authenticate (reusing logic or assuming session)
    // We'll just go to the favorites page directly
    await page.goto('/buyer/favorites');
    await expect(page.locator('text=No favorites yet')).toBeVisible();
  });
});
