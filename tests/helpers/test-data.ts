/**
 * Test data generation utilities
 */

/**
 * Generate a unique test email using timestamp
 */
export function generateTestEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@example.com`;
}

/**
 * Generate a secure test password
 */
export function generateTestPassword(): string {
    return `TestPass${Date.now()}!`;
}

/**
 * Generate a unique test task title
 */
export function generateTestTaskTitle(): string {
    const timestamp = Date.now();
    return `Test Task ${timestamp}`;
}

/**
 * Generate test task description
 */
export function generateTestTaskDescription(): string {
    return `This is a test task created at ${new Date().toISOString()}`;
}
