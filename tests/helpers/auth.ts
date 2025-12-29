import { Page, expect } from '@playwright/test';

/**
 * Authentication helper functions for Playwright tests
 */

/**
 * Sign up a new user
 */
export async function signUp(page: Page, email: string, password: string) {
    // Navigate to signup page
    await page.goto('/signup');

    // Fill in signup form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit form - use text-based selector for reliability
    await page.getByRole('button', { name: /sign up/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Log in an existing user
 */
export async function login(page: Page, email: string, password: string) {
    // Navigate to login page
    await page.goto('/login');

    // Fill in login form
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);

    // Submit form - use text-based selector for reliability
    await page.getByRole('button', { name: /sign in/i }).click();

    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Log out the current user
 */
export async function logout(page: Page) {
    // Click logout button (adjust selector as needed)
    await page.click('text=Logout');

    // Wait for redirect to login
    await page.waitForURL('/login', { timeout: 5000 });
}

/**
 * Check if user is authenticated by checking URL
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
    const url = page.url();
    return url.includes('/dashboard');
}

/**
 * Sign up and return credentials for cleanup
 */
export async function signUpAndGetCredentials(page: Page): Promise<{ email: string; password: string }> {
    const timestamp = Date.now();
    const email = `test-${timestamp}@example.com`;
    const password = `TestPass${timestamp}!`;

    await signUp(page, email, password);

    return { email, password };
}
