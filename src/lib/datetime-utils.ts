/**
 * Date and time utility functions for task scheduling
 * Handles conversion between date+time inputs and due_at timestamptz
 */

/**
 * Convert date (YYYY-MM-DD) and optional time (HH:mm) to ISO timestamptz string
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Optional time string in HH:mm format
 * @param allDay - If true, time is set to 00:00 (all-day task)
 * @returns ISO timestamptz string or null
 */
export function combineDateTimeToISO(
    date: string | null,
    time: string | null,
    allDay: boolean = false
): string | null {
    if (!date) return null

    // If all-day or no time provided, set to start of day (00:00)
    const timeStr = allDay || !time ? '00:00:00' : `${time}:00`

    // Combine date + time and convert to ISO string
    // Use local timezone, then convert to ISO
    const localDateTime = new Date(`${date}T${timeStr}`)
    
    // Return ISO string (includes timezone)
    return localDateTime.toISOString()
}

/**
 * Extract date (YYYY-MM-DD) from due_at timestamptz
 * @param dueAt - ISO timestamptz string
 * @returns Date string in YYYY-MM-DD format or null
 */
export function extractDateFromDueAt(dueAt: string | null): string | null {
    if (!dueAt) return null
    return dueAt.split('T')[0]
}

/**
 * Extract time (HH:mm) from due_at timestamptz
 * @param dueAt - ISO timestamptz string
 * @returns Time string in HH:mm format or null
 */
export function extractTimeFromDueAt(dueAt: string | null): string | null {
    if (!dueAt) return null
    
    // Parse ISO string and extract hours:minutes
    const date = new Date(dueAt)
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${hours}:${minutes}`
}

/**
 * Check if a task is all-day based on due_at
 * All-day tasks have time = 00:00
 * @param dueAt - ISO timestamptz string
 * @returns True if all-day, false if timed, null if no due_at
 */
export function isAllDayTask(dueAt: string | null): boolean | null {
    if (!dueAt) return null
    
    const time = extractTimeFromDueAt(dueAt)
    return time === '00:00'
}

/**
 * Format time for display in month view badge
 * @param dueAt - ISO timestamptz string
 * @returns Formatted time string (e.g., "09:30") or "All day"
 */
export function formatTimeBadge(dueAt: string | null): string {
    if (!dueAt) return 'All day'
    
    const isAllDay = isAllDayTask(dueAt)
    if (isAllDay) return 'All day'
    
    return extractTimeFromDueAt(dueAt) || 'All day'
}

/**
 * Sort tasks: timed tasks first (by time), then all-day tasks
 * @param tasks - Array of tasks with due_at
 * @returns Sorted array
 */
export function sortTasksByDueAt<T extends { due_at: string | null }>(tasks: T[]): T[] {
    return [...tasks].sort((a, b) => {
        // Both null -> equal
        if (!a.due_at && !b.due_at) return 0
        
        // Null tasks go to end
        if (!a.due_at) return 1
        if (!b.due_at) return -1
        
        // Check if all-day
        const aIsAllDay = isAllDayTask(a.due_at)
        const bIsAllDay = isAllDayTask(b.due_at)
        
        // Timed tasks come before all-day
        if (aIsAllDay && !bIsAllDay) return 1
        if (!aIsAllDay && bIsAllDay) return -1
        
        // Both timed or both all-day -> sort by due_at
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime()
    })
}

/**
 * Get hour from due_at for timeline positioning
 * @param dueAt - ISO timestamptz string
 * @returns Hour (0-23) or null
 */
export function getHourFromDueAt(dueAt: string | null): number | null {
    if (!dueAt) return null
    const date = new Date(dueAt)
    return date.getHours()
}

/**
 * Group tasks by date from due_at
 * @param tasks - Array of tasks with due_at
 * @returns Map of date keys to task arrays
 */
export function groupTasksByDueAt(tasks: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()

    tasks.forEach(task => {
        const dateKey = extractDateFromDueAt(task.due_at) || task.due_date || task.created_at?.split('T')[0]
        if (dateKey) {
            if (!grouped.has(dateKey)) {
                grouped.set(dateKey, [])
            }
            grouped.get(dateKey)!.push(task)
        }
    })

    return grouped
}

