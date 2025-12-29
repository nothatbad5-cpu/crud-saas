import { test, expect } from '@playwright/test';
import { signUp } from './helpers/auth';
import { generateTestEmail, generateTestPassword, generateTestTaskTitle } from './helpers/test-data';
import { getTodayDateKey, getCurrentMonthYear, getDayOfMonth } from './helpers/date';

test.describe('Calendar View', () => {
    let testEmail: string;
    let testPassword: string;

    test.beforeEach(async ({ page }) => {
        // Sign up and login before each test
        testEmail = generateTestEmail();
        testPassword = generateTestPassword();
        await signUp(page, testEmail, testPassword);
    });

    test('should switch from table to calendar view', async ({ page }) => {
        // Should start on dashboard with table view
        await expect(page).toHaveURL('/dashboard');

        // Click Calendar toggle
        await page.click('button:has-text("Calendar")');

        // Calendar grid should be visible
        await expect(page.locator('text=/January|February|March|April|May|June|July|August|September|October|November|December/')).toBeVisible();

        // Month navigation should be visible
        await expect(page.locator('button:has-text("Today")')).toBeVisible();
    });

    test('should display monthly calendar grid', async ({ page }) => {
        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Get current month/year
        const { month, year } = getCurrentMonthYear();

        // Month and year should be displayed
        await expect(page.locator(`text=${month} ${year}`)).toBeVisible();

        // Day headers should be visible
        await expect(page.locator('text=Sun')).toBeVisible();
        await expect(page.locator('text=Mon')).toBeVisible();
        await expect(page.locator('text=Sat')).toBeVisible();
    });

    test('should open day panel when clicking a date', async ({ page }) => {
        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Get today's date
        const todayKey = getTodayDateKey();
        const dayOfMonth = getDayOfMonth(todayKey);

        // Click on today's date cell
        // This selector may need adjustment based on your calendar structure
        await page.locator(`.calendar-grid`).locator(`text=${dayOfMonth}`).first().click();

        // Day panel should open
        await expect(page.locator('[class*="day-panel"]')).toBeVisible({ timeout: 2000 });
    });

    test('should create task inline from day panel', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Click on a date to open day panel
        const todayKey = getTodayDateKey();
        const dayOfMonth = getDayOfMonth(todayKey);
        await page.locator(`.calendar-grid`).locator(`text=${dayOfMonth}`).first().click();

        // Wait for day panel
        await page.waitForSelector('[class*="day-panel"]', { timeout: 2000 });

        // Fill in inline task creation
        await page.fill('input[placeholder*="Add a task" i]', taskTitle);
        await page.press('input[placeholder*="Add a task" i]', 'Enter');

        // Wait for task to be created
        await page.waitForTimeout(1000);

        // Task should appear in day panel
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
    });

    test('should close day panel', async ({ page }) => {
        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Open day panel
        const todayKey = getTodayDateKey();
        const dayOfMonth = getDayOfMonth(todayKey);
        await page.locator(`.calendar-grid`).locator(`text=${dayOfMonth}`).first().click();

        // Day panel should be visible
        await expect(page.locator('[class*="day-panel"]')).toBeVisible();

        // Click close button (X)
        await page.click('button[aria-label*="Close" i]');

        // Day panel should be hidden
        await expect(page.locator('[class*="day-panel"]')).not.toBeVisible();
    });

    test('should navigate between months', async ({ page }) => {
        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Get current month
        const { month: currentMonth } = getCurrentMonthYear();

        // Click next month button
        await page.click('button[aria-label="Next month"]');

        // Month should change
        await page.waitForTimeout(500);

        // Click previous month button twice to go back
        await page.click('button[aria-label="Previous month"]');

        // Should be back to current month
        await expect(page.locator(`text=${currentMonth}`)).toBeVisible();
    });

    test('should return to current month with Today button', async ({ page }) => {
        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Navigate to next month
        await page.click('button[aria-label="Next month"]');
        await page.waitForTimeout(500);

        // Click Today button
        await page.click('button:has-text("Today")');

        // Should be back to current month
        const { month, year } = getCurrentMonthYear();
        await expect(page.locator(`text=${month} ${year}`)).toBeVisible();
    });

    test('should create timed task and verify it appears with time in month view', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Click New Task button (FAB or header button)
        await page.click('button:has-text("New Task")');

        // Fill in task details
        await page.fill('input[placeholder*="title" i]', taskTitle);
        
        // Uncheck "All day" to enable time picker
        const allDayCheckbox = page.locator('input[type="checkbox"][name="allDay"], input[type="checkbox"][id="allDay"]');
        if (await allDayCheckbox.isChecked()) {
            await allDayCheckbox.click();
        }

        // Set time to 14:30 (2:30 PM)
        await page.fill('input[type="time"][name="dueTime"], input[type="time"][id="dueTime"]', '14:30');

        // Submit
        await page.click('button:has-text("Create")');

        // Wait for modal to close and task to appear
        await page.waitForTimeout(2000);

        // Task should appear in calendar with time badge
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
        
        // Time should be visible (either "14:30" or formatted)
        await expect(page.locator('text=/14:30|2:30|14|2.*PM/i')).toBeVisible({ timeout: 3000 });
    });

    test('should click day and verify task appears in correct time slot in day view', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Create a timed task first
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', taskTitle);
        
        // Uncheck "All day"
        const allDayCheckbox = page.locator('input[type="checkbox"][name="allDay"], input[type="checkbox"][id="allDay"]');
        if (await allDayCheckbox.isChecked()) {
            await allDayCheckbox.click();
        }

        // Set time to 10:00 AM
        await page.fill('input[type="time"][name="dueTime"], input[type="time"][id="dueTime"]', '10:00');
        await page.click('button:has-text("Create")');
        await page.waitForTimeout(2000);

        // Click on today's date to open day panel
        const todayKey = getTodayDateKey();
        const dayOfMonth = getDayOfMonth(todayKey);
        await page.locator(`.calendar-grid`).locator(`text=${dayOfMonth}`).first().click();

        // Wait for timeline view to open
        await page.waitForSelector('text=/All day|6 AM|7 AM|8 AM|9 AM|10 AM/i', { timeout: 3000 });

        // Task should appear in the timeline (look for 10 AM section)
        await expect(page.locator('text=/10 AM|10:00/i')).toBeVisible();
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
    });

    test('should create all-day task and verify it appears under "All day"', async ({ page }) => {
        const taskTitle = generateTestTaskTitle();

        // Switch to calendar view
        await page.click('button:has-text("Calendar")');

        // Create an all-day task
        await page.click('button:has-text("New Task")');
        await page.fill('input[placeholder*="title" i]', taskTitle);
        
        // Ensure "All day" is checked (should be by default)
        const allDayCheckbox = page.locator('input[type="checkbox"][name="allDay"], input[type="checkbox"][id="allDay"]');
        if (!(await allDayCheckbox.isChecked())) {
            await allDayCheckbox.click();
        }

        await page.click('button:has-text("Create")');
        await page.waitForTimeout(2000);

        // Click on today's date to open day panel
        const todayKey = getTodayDateKey();
        const dayOfMonth = getDayOfMonth(todayKey);
        await page.locator(`.calendar-grid`).locator(`text=${dayOfMonth}`).first().click();

        // Wait for timeline view
        await page.waitForSelector('text=/All day/i', { timeout: 3000 });

        // Task should appear under "All day" section
        await expect(page.locator('text=All day')).toBeVisible();
        await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
    });
});
