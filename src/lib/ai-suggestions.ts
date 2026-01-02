/**
 * AI Suggestions utility - analyzes completed tasks to suggest recurring patterns
 */

export interface TaskSuggestion {
    title: string
    weekday: string
    count: number
}

/**
 * Normalize task title for comparison
 */
export function normalizeTitle(title: string): string {
    return title.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Get weekday abbreviation from date
 * Returns: 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'
 */
export function getWeekdayAbbr(date: Date): string {
    const day = date.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
    const abbrs = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    return abbrs[day]
}

/**
 * Analyze completed tasks to find recurring patterns
 * Returns suggestions for tasks that:
 * - Have same normalized title completed >= 3 times
 * - Have consistent weekday pattern
 */
export function analyzeCompletedTasks(completedTasks: Array<{
    title: string
    updated_at: string
    created_at: string
}>): TaskSuggestion[] {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Filter tasks completed in last 30 days
    const recentTasks = completedTasks.filter(task => {
        const completedDate = new Date(task.updated_at || task.created_at)
        return completedDate >= thirtyDaysAgo
    })

    // Group by normalized title
    const titleGroups = new Map<string, Array<{ weekday: string }>>()

    for (const task of recentTasks) {
        const normalizedTitle = normalizeTitle(task.title)
        const completedDate = new Date(task.updated_at || task.created_at)
        const weekday = getWeekdayAbbr(completedDate)

        if (!titleGroups.has(normalizedTitle)) {
            titleGroups.set(normalizedTitle, [])
        }
        titleGroups.get(normalizedTitle)!.push({ weekday })
    }

    // Find patterns with >= 3 completions and consistent weekday
    const suggestions: TaskSuggestion[] = []

    for (const [normalizedTitle, completions] of titleGroups.entries()) {
        if (completions.length < 3) continue

        // Count weekday occurrences
        const weekdayCounts = new Map<string, number>()
        for (const completion of completions) {
            weekdayCounts.set(completion.weekday, (weekdayCounts.get(completion.weekday) || 0) + 1)
        }

        // Find most common weekday
        let maxCount = 0
        let mostCommonWeekday: string | null = null

        for (const [weekday, count] of weekdayCounts.entries()) {
            if (count > maxCount) {
                maxCount = count
                mostCommonWeekday = weekday
            }
        }

        // If most common weekday appears at least 3 times and is >= 50% of completions
        if (mostCommonWeekday && maxCount >= 3 && maxCount >= completions.length * 0.5) {
            // Find original title (use first occurrence)
            const originalTask = recentTasks.find(t => normalizeTitle(t.title) === normalizedTitle)
            if (originalTask) {
                suggestions.push({
                    title: originalTask.title,
                    weekday: mostCommonWeekday,
                    count: maxCount
                })
            }
        }
    }

    return suggestions
}

