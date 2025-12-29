import { test, expect } from '@playwright/test';
import { signUp } from './helpers/auth';
import { generateTestEmail, generateTestPassword, generateTestTaskTitle } from './helpers/test-data';

test.describe('Free Plan Limit', () => {
    let testEmail: string;
    let testPassword: string;

    test.beforeEach(async ({ page }) => {
        // Sign up and login before each test
        testEmail = generateTestEmail();
        testPassword = generateTestPassword();
        await signUp(page, testEmail, testPassword);
    });

    test('should enforce 5-task limit for free users', async ({ page }) => {
        // Create 5 tasks (the free plan limit)
        for (let i = 1; i <= 5; i++) {
            const taskTitle = `Task ${i} - ${Date.now()}`;

            await page.click('button:has-text("New Task")');
            await page.fill('input[placeholder*="title" i]', taskTitle);
            await page.click('button:has-text("Create")');
            await page.waitForTimeout(500);
        }

        // Verify 5 tasks exist
        const taskRows = page.locator('tbody tr');
        await expect(taskRows).toHaveCount(5);

        // Try to create 6th task
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', 'Task 6 - Should Fail');
        await page.click('button:has-text("Create")');

        // Should show error message
        await expect(page.locator('text=/limit|upgrade|pro/i')).toBeVisible({ timeout: 3000 });

        // Task count should still be 5
        await expect(taskRows).toHaveCount(5);
    });

    test('should show upgrade CTA when limit reached', async ({ page }) => {
        // Create 5 tasks to reach limit
        for (let i = 1; i <= 5; i++) {
            const taskTitle = `Task ${i} - ${Date.now()}`;
            await page.click('button:has-text("New Task")');
            await page.fill('input[placeholder*="title" i]', taskTitle);
            await page.click('button:has-text("Create")');
            await page.waitForTimeout(500);
        }

        // Try to create 6th task
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', 'Task 6');
        await page.click('button:has-text("Create")');

        // Upgrade link should be visible
        await expect(page.locator('a:has-text("Upgrade")')).toBeVisible();
    });

    test('should display task count for free users', async ({ page }) => {
        // Create 2 tasks
        for (let i = 1; i <= 2; i++) {
            const taskTitle = `Task ${i} - ${Date.now()}`;
            await page.click('button:has-text("New Task")');
            await page.fill('input[placeholder*="title" i]', taskTitle);
            await page.click('button:has-text("Create")');
            await page.waitForTimeout(500);
        }

        // Should show "2 / 5 tasks"
        await expect(page.locator('text=/2.*5.*tasks/i')).toBeVisible();
    });

    test('should allow task deletion when at limit', async ({ page }) => {
        // Create 5 tasks to reach limit
        const taskTitles: string[] = [];
        for (let i = 1; i <= 5; i++) {
            const taskTitle = `Task ${i} - ${Date.now()}`;
            taskTitles.push(taskTitle);
            await page.click('button:has-text("New Task")');
            await page.fill('input[placeholder*="title" i]', taskTitle);
            await page.click('button:has-text("Create")');
            await page.waitForTimeout(500);
        }

        // Delete one task
        const taskRow = page.locator(`tr:has-text("${taskTitles[0]}")`);
        page.on('dialog', dialog => dialog.accept());
        await taskRow.locator('button:has-text("Delete")').click();
        await page.waitForTimeout(1000);

        // Should now have 4 tasks
        const taskRows = page.locator('tbody tr');
        await expect(taskRows).toHaveCount(4);

        // Should be able to create a new task now
        const newTaskTitle = `New Task - ${Date.now()}`;
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', newTaskTitle);
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(500);

        // Should have 5 tasks again
        await expect(taskRows).toHaveCount(5);
        await expect(page.locator(`text=${newTaskTitle}`)).toBeVisible();
    });
});
