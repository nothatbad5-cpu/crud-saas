import { test, expect } from '@playwright/test';
import { signUp, login, logout } from './helpers/auth';
import { generateTestEmail, generateTestPassword } from './helpers/test-data';

test.describe('Authentication Flow', () => {
    let testEmail: string;
    let testPassword: string;

    test.beforeEach(() => {
        // Generate unique credentials for each test
        testEmail = generateTestEmail();
        testPassword = generateTestPassword();
    });

    test('should redirect to login from homepage when not authenticated', async ({ page }) => {
        await page.goto('/');

        // Should redirect to login
        await expect(page).toHaveURL('/login');
    });

    test('should sign up a new user successfully', async ({ page }) => {
        await page.goto('/signup');

        // Fill signup form
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        // Submit
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

        // Dashboard should be visible
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should log out successfully', async ({ page }) => {
        // First sign up
        await signUp(page, testEmail, testPassword);

        // Verify we're on dashboard
        await expect(page).toHaveURL('/dashboard');

        // Log out
        await page.click('text=Logout');

        // Should redirect to login
        await expect(page).toHaveURL('/login', { timeout: 5000 });
    });

    test('should log in with existing credentials', async ({ page }) => {
        // First sign up
        await signUp(page, testEmail, testPassword);

        // Log out
        await logout(page);

        // Now log in again
        await login(page, testEmail, testPassword);

        // Should be on dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid login', async ({ page }) => {
        await page.goto('/login');

        // Try to login with non-existent credentials
        await page.fill('input[type="email"]', 'nonexistent@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Should show error (adjust selector based on your error display)
        await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
    });

    test('should log in with static test user (deterministic)', async ({ page }) => {
        const email = process.env.TEST_EMAIL;
        const password = process.env.TEST_PASSWORD;

        // Skip if not configured (but we expect it to be)
        if (!email || !password) {
            test.skip();
            return;
        }

        await page.goto('/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
});
