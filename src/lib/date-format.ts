/**
 * Deterministic date formatting utilities
 * These functions produce the same output on server and client regardless of locale
 * Prevents hydration mismatches
 */

/**
 * Format date as YYYY-MM-DD (ISO date format)
 * Stable across all locales and timezones
 */
export function formatDateYYYYMMDD(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

/**
 * Format date as "MMM DD, YYYY" (e.g., "Dec 30, 2025")
 * Uses hardcoded en-US locale and UTC timezone for consistency
 */
export function formatDatePretty(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    })
    return formatter.format(d)
}

/**
 * Format date as "Weekday, Month Day, Year" (e.g., "Monday, December 30, 2025")
 * Uses hardcoded en-US locale and UTC timezone for consistency
 */
export function formatDateLong(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
    })
    return formatter.format(d)
}

/**
 * Format date as "Weekday, MMM Day" (e.g., "Monday, Dec 30")
 * Uses hardcoded en-US locale and UTC timezone for consistency
 */
export function formatDateShort(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    })
    return formatter.format(d)
}

