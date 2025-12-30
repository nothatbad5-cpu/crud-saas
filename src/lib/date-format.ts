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

/**
 * Format time as HH:mm (24-hour format)
 * Deterministic, no locale dependency
 */
export function formatTimeHHMM(dateInput: string | Date): string | null {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return null
    }
    const hours = String(d.getUTCHours()).padStart(2, '0')
    const minutes = String(d.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
}

/**
 * Get day label for grouping: "Today", "Tomorrow", "Day after tomorrow", or YYYY-MM-DD
 * Uses UTC for consistency
 */
export function formatDayLabel(dateInput: string | Date): string {
    // If input is already a date string (YYYY-MM-DD), use it directly
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const today = new Date()
        today.setUTCHours(0, 0, 0, 0)
        const todayKey = formatDateYYYYMMDD(today)
        
        if (dateInput === todayKey) {
            return 'Today'
        }
        
        // Calculate tomorrow and day after
        const tomorrow = new Date(today)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
        const tomorrowKey = formatDateYYYYMMDD(tomorrow)
        
        if (dateInput === tomorrowKey) {
            return 'Tomorrow'
        }
        
        const dayAfter = new Date(today)
        dayAfter.setUTCDate(dayAfter.getUTCDate() + 2)
        const dayAfterKey = formatDateYYYYMMDD(dayAfter)
        
        if (dateInput === dayAfterKey) {
            return 'Day after tomorrow'
        }
        
        return dateInput
    }
    
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    
    // Get today's date in UTC (start of day)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayKey = formatDateYYYYMMDD(today)
    
    // Get input date in UTC (start of day)
    const inputDate = new Date(d)
    inputDate.setUTCHours(0, 0, 0, 0)
    const inputKey = formatDateYYYYMMDD(inputDate)
    
    if (inputKey === todayKey) {
        return 'Today'
    }
    
    // Calculate tomorrow and day after
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowKey = formatDateYYYYMMDD(tomorrow)
    
    if (inputKey === tomorrowKey) {
        return 'Tomorrow'
    }
    
    const dayAfter = new Date(today)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 2)
    const dayAfterKey = formatDateYYYYMMDD(dayAfter)
    
    if (inputKey === dayAfterKey) {
        return 'Day after tomorrow'
    }
    
    // Return YYYY-MM-DD for future dates
    return inputKey
}

/**
 * Get date key (YYYY-MM-DD) for grouping tasks
 * Uses UTC for consistency
 */
export function getDateKey(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return ''
    }
    return formatDateYYYYMMDD(d)
}

