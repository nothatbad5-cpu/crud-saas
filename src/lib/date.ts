/**
 * Deterministic date formatting utilities
 * These functions produce the same output on server and client regardless of locale
 * Prevents hydration mismatches
 */

/**
 * Format date as YYYY-MM-DD (ISO date format)
 * Stable across all locales and timezones
 */
export function formatDateISO(dateInput: string | Date): string {
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
 * Alias for formatDateISO - format date as YYYY-MM-DD
 */
export function formatDateYYYYMMDD(dateInput: string | Date): string {
    return formatDateISO(dateInput)
}

/**
 * Format time as HH:mm (24-hour format)
 * Deterministic, no locale dependency
 */
export function formatTimeISO(dateInput: string | Date): string | null {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return null
    }
    const hours = String(d.getUTCHours()).padStart(2, '0')
    const minutes = String(d.getUTCMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
}

/**
 * Alias for formatTimeISO - format time as HH:mm
 */
export function formatTimeHHMM(dateInput: string | Date): string | null {
    return formatTimeISO(dateInput)
}

/**
 * Format relative label: "Today", "Tomorrow", or formatted date
 */
export function formatRelativeLabel(dateInput: string | Date): string {
    const dateStr = typeof dateInput === 'string' ? dateInput : formatDateISO(dateInput)
    return dayLabel(dateStr)
}

/**
 * Format date in readable format: "Jan 4, 2026"
 * Deterministic, no locale dependency
 */
export function formatDateReadable(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return 'Invalid date'
    }
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const month = monthNames[d.getUTCMonth()]
    const day = d.getUTCDate()
    const year = d.getUTCFullYear()
    return `${month} ${day}, ${year}`
}

/**
 * Format time in 12-hour format: "3:00 PM"
 * Deterministic, no locale dependency
 */
export function formatTime12Hour(dateInput: string | Date): string | null {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return null
    }
    let hours = d.getUTCHours()
    const minutes = d.getUTCMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    hours = hours % 12
    hours = hours ? hours : 12 // 0 should be 12
    const minutesStr = String(minutes).padStart(2, '0')
    return `${hours}:${minutesStr} ${ampm}`
}

/**
 * Get day label for grouping: "Today", "Tomorrow", "Day after tomorrow", or YYYY-MM-DD
 * Uses UTC for consistency
 */
export function dayLabel(dateISO: string): string {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
        return dateISO
    }
    
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayKey = formatDateISO(today)
    
    if (dateISO === todayKey) {
        return 'Today'
    }
    
    // Calculate tomorrow
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    const tomorrowKey = formatDateISO(tomorrow)
    
    if (dateISO === tomorrowKey) {
        return 'Tomorrow'
    }
    
    // Calculate day after tomorrow
    const dayAfter = new Date(today)
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 2)
    const dayAfterKey = formatDateISO(dayAfter)
    
    if (dateISO === dayAfterKey) {
        return 'Day after tomorrow'
    }
    
    // Return YYYY-MM-DD for future dates
    return dateISO
}

/**
 * Get date key (YYYY-MM-DD) for grouping tasks
 * Uses UTC for consistency
 */
export function startOfDayKey(dateInput: string | Date): string {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) {
        return ''
    }
    d.setUTCHours(0, 0, 0, 0)
    return formatDateISO(d)
}

