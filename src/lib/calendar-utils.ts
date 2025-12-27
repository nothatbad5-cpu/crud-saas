/**
 * Calendar utility functions for date manipulation and calendar grid generation
 */

export interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    dateKey: string
}

/**
 * Get all days to display in a monthly calendar grid (including prev/next month padding)
 */
export function getMonthDays(year: number, month: number): CalendarDay[] {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)

    // Start from Sunday of the week containing the 1st
    startDate.setDate(startDate.getDate() - startDate.getDay())

    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Generate 6 weeks (42 days) to ensure consistent grid
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)

        days.push({
            date,
            isCurrentMonth: date.getMonth() === month,
            isToday: date.getTime() === today.getTime(),
            dateKey: formatDateKey(date)
        })
    }

    return days
}

/**
 * Format date as YYYY-MM-DD for consistent keys
 */
export function formatDateKey(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
    const today = new Date()
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    )
}

/**
 * Get month name
 */
export function getMonthName(month: number): string {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return months[month]
}

/**
 * Group tasks by their due_at date (or due_date/created_at as fallback)
 */
export function groupTasksByDate(tasks: any[]): Map<string, any[]> {
    const grouped = new Map<string, any[]>()

    tasks.forEach(task => {
        // Prefer due_at, fallback to due_date, then created_at
        let dateStr: string | null = null
        
        if (task.due_at) {
            // Extract date from timestamptz
            dateStr = task.due_at.split('T')[0]
        } else if (task.due_date) {
            dateStr = task.due_date
        } else if (task.created_at) {
            dateStr = task.created_at.split('T')[0]
        }
        
        if (dateStr) {
            if (!grouped.has(dateStr)) {
                grouped.set(dateStr, [])
            }
            grouped.get(dateStr)!.push(task)
        }
    })

    return grouped
}

/**
 * Navigate to previous month
 */
export function getPreviousMonth(year: number, month: number): { year: number; month: number } {
    if (month === 0) {
        return { year: year - 1, month: 11 }
    }
    return { year, month: month - 1 }
}

/**
 * Navigate to next month
 */
export function getNextMonth(year: number, month: number): { year: number; month: number } {
    if (month === 11) {
        return { year: year + 1, month: 0 }
    }
    return { year, month: month + 1 }
}
