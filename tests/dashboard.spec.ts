import { test, expect } from '@playwright/test';
import { signUp } from './helpers/auth';
import { generateTestEmail, generateTestPassword, generateTestTaskTitle } from './helpers/test-data';

test.describe('Dashboard - Task Management', () => {
    let testEmail: string;
    let testPassword: string;

    test.beforeEach(async ({ page }) => {
        // Sign up and login before each test
        testEmail = generateTestEmail();
        testPassword = generateTestPassword();
        await signUp(page, testEmail, testPassword);
    });

    test('should load dashboard successfully', async ({ page }) => {
        // Should be on dashboard
        await expect(page).toHaveURL('/dashboard');

        // Dashboard title should be visible
        await expect(page.locator('text=Dashboard')).toBeVisible();

        // New Task button should be visible
        await expect(page.locator('button:has-text("New Task")')).toBeVisible();
    });

    test('should create a new task', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Click New Task button
        await page.click('button:has-text("New Task")');

        // Fill in task details
        await page.fill('input[placeholder*="title" i]', taskTitle);
        await page.fill('textarea[placeholder*="description" i]', 'Test task description');

        // Submit
        await page.click('button:has-text("Create")');

        // Wait for modal to close and task to appear
        await page.waitForTimeout(1000);

        // Task should appear in the table
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
    });

    test('should edit a task', async ({ page }) => {
        const originalTitle = generateTestTaskTitle();
        const updatedTitle = `${originalTitle} - Updated`;

        // Create a task first
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', originalTitle);
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Find and click edit button for the task
        const taskRow = page.locator(`tr:has-text("${originalTitle}")`);
        await taskRow.locator('a:has-text("Edit")').click();

        // Update title
        await page.fill('input[name="title"]', updatedTitle);
        await page.click('button:has-text("Update")');

        // Wait for redirect
        await page.waitForURL('/dashboard');

        // Updated title should be visible
        await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();

        // Original title should not be visible
        await expect(page.locator(`text=${originalTitle}`)).not.toBeVisible();
    });

    test('should delete a task', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Create a task first
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', taskTitle);
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Verify task exists
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();

        // Find and click delete button
        const taskRow = page.locator(`tr:has-text("${taskTitle}")`);

        // Handle confirmation dialog
        page.on('dialog', dialog => dialog.accept());
        await taskRow.locator('button:has-text("Delete")').click();

        // Wait for deletion
        await page.waitForTimeout(1000);

        // Task should no longer be visible
        await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
    });

    test('should toggle task status', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Create a task
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', taskTitle);
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(1000);

        // Find task row
        const taskRow = page.locator(`tr:has-text("${taskTitle}")`);

        // Initial status should be "pending"
        await expect(taskRow.locator('text=/pending/i')).toBeVisible();

        // Click checkbox to toggle status
        await taskRow.locator('input[type="checkbox"]').click();

        // Wait for update
        await page.waitForTimeout(1000);

        // Status should change to "completed"
        await expect(taskRow.locator('text=/completed/i')).toBeVisible();
    });
});
