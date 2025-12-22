/**
 * Time utility functions for task scheduling
 */

/**
 * Format time string for display
 * @param time - Time string in HH:MM format or null
 * @returns Formatted time string or empty string
 */
export function formatTime(time: string | null): string {
    if (!time) return ''
    return time
}

/**
 * Parse time input and validate format
 * @param input - Time input string
 * @returns Validated time string in HH:MM format or null
 */
export function parseTimeInput(input: string): string | null {
    if (!input || input.trim() === '') return null

    // Input from type="time" is already in HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (timeRegex.test(input)) {
        return input
    }

    return null
}

/**
 * Validate that end time is after or equal to start time
 * @param start - Start time string
 * @param end - End time string
 * @returns True if valid, false otherwise
 */
export function isValidTimeRange(start: string | null, end: string | null): boolean {
    // If either is null, it's valid (optional fields)
    if (!start || !end) return true

    // Compare times as strings (HH:MM format allows string comparison)
    return end >= start
}

/**
 * Format time range for display
 * @param start - Start time
 * @param end - End time
 * @returns Formatted time range string
 */
export function formatTimeRange(start: string | null, end: string | null): string {
    if (!start) return ''
    if (!end) return start
    return `${start} - ${end}`
}

/**
 * Format time for task chip display (short format)
 * @param start - Start time
 * @returns Formatted time for chip prefix
 */
export function formatTimeForChip(start: string | null): string {
    if (!start) return ''
    return start // Already in HH:MM format
}

/**
 * Sort tasks by start time
 * @param tasks - Array of tasks with start_time
 * @returns Sorted array
 */
export function sortTasksByTime<T extends { start_time: string | null }>(tasks: T[]): T[] {
    return [...tasks].sort((a, b) => {
        if (!a.start_time && !b.start_time) return 0
        if (!a.start_time) return 1
        if (!b.start_time) return -1
        return a.start_time.localeCompare(b.start_time)
    })
}
