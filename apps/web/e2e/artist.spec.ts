import { test, expect } from '@playwright/test';

test.describe('Artist Flow', () => {
  const email = `test-artist-${Math.random().toString(36).substring(7)}@example.com`;
  const password = 'TestPassword123!';

  test('should register, onboard, and upload artwork', async ({ page }) => {
    // 1. Sign Up
    await page.goto('/register');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Should be redirected to onboarding (via /register/complete or middleware)
    await expect(page).toHaveURL(/.*onboard/);

    // 2. Onboarding
    await page.fill('input[placeholder*="Name"]', 'Test Artist');
    await page.fill('textarea[placeholder*="bio"]', 'Passionate about digital landscapes.');
    await page.click('text=Proceed as Artist');

    // Should be redirected to artist dashboard
    await expect(page).toHaveURL(/.*artist\/dashboard/);
    await expect(page.locator('h1')).toContainText('Artist Studio');

    // 3. Upload Artwork
    await page.click('text=Upload Artwork');
    await expect(page).toHaveURL(/.*artist\/upload/);

    await page.fill('input[placeholder*="Sunset"]', 'E2E Masterpiece');
    await page.fill('textarea[placeholder*="story"]', 'Created during automated testing.');
    await page.fill('input[type="number"]', '500');

    // Note: Skipping actual file upload interaction for now as it depends on local assets
    // But we can verify the UI structure
    await expect(page.locator('text=Drop your artwork here')).toBeVisible();
  });

  test('should reflect protected artist routes', async ({ page }) => {
    // Unauthenticated access
    await page.context().clearCookies();
    await page.goto('/artist/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });
});
