/**
 * Date utility functions for tests
 */

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateKey(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Get tomorrow's date in YYYY-MM-DD format
 */
export function getTomorrowDateKey(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
}

/**
 * Get date N days from now in YYYY-MM-DD format
 */
export function getDateKeyDaysFromNow(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

/**
 * Format date for input[type="date"] value
 */
export function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Get current month and year for calendar
 */
export function getCurrentMonthYear(): { month: string; year: string } {
    const now = new Date();
    const month = now.toLocaleString('en-US', { month: 'long' });
    const year = now.getFullYear().toString();
    return { month, year };
}

/**
 * Get day of month (1-31)
 */
export function getDayOfMonth(dateKey: string): number {
    const date = new Date(dateKey);
    return date.getDate();
}
