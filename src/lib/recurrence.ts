/**
 * Recurrence utility functions
 * Supports daily, weekly (by weekday), and monthly (by day of month) patterns
 */

import { RRule, Frequency, Options, Weekday } from 'rrule'
import { startOfDayKey, formatDateISO } from './date'

export interface RecurrencePattern {
    freq: 'DAILY' | 'WEEKLY' | 'MONTHLY'
    byday?: string // For weekly: 'MO', 'TU', 'WE', etc.
    bymonthday?: number // For monthly: day of month (1-31)
    time?: string // Optional time in HH:mm format
}

/**
 * Parse a simple recurrence rule string into a pattern
 * Supports formats like:
 * - "daily" or "DAILY"
 * - "weekly:MO" or "WEEKLY:MO" (Monday)
 * - "monthly:1" or "MONTHLY:1" (1st of month)
 * - "weekly:MO:09:00" (Monday at 9am)
 */
export function parseRecurrenceRule(rule: string): RecurrencePattern | null {
    if (!rule || !rule.trim()) return null

    const parts = rule.toUpperCase().split(':')
    const freq = parts[0].trim()

    if (freq === 'DAILY') {
        return {
            freq: 'DAILY',
            time: parts[1] || undefined
        }
    }

    if (freq === 'WEEKLY') {
        if (!parts[1]) return null
        return {
            freq: 'WEEKLY',
            byday: parts[1].trim(),
            time: parts[2] || undefined
        }
    }

    if (freq === 'MONTHLY') {
        if (!parts[1]) return null
        const day = parseInt(parts[1].trim(), 10)
        if (isNaN(day) || day < 1 || day > 31) return null
        return {
            freq: 'MONTHLY',
            bymonthday: day,
            time: parts[2] || undefined
        }
    }

    return null
}

/**
 * Calculate the next occurrence date/time from a recurrence pattern
 * @param pattern - The recurrence pattern
 * @param fromDate - The date to calculate from (typically the current due date)
 * @returns ISO timestamp string for the next occurrence, or null if calculation fails
 */
export function getNextOccurrence(pattern: RecurrencePattern, fromDate: Date): string | null {
    try {
        // Map frequency string to RRule Frequency enum
        const freqMap: Record<string, Frequency> = {
            'DAILY': RRule.DAILY,
            'WEEKLY': RRule.WEEKLY,
            'MONTHLY': RRule.MONTHLY
        }
        
        const options: Partial<Options> = {
            freq: freqMap[pattern.freq],
            dtstart: fromDate,
            count: 2 // Get next occurrence
        }

        if (pattern.freq === 'WEEKLY' && pattern.byday) {
            // Map day abbreviations to RRule weekdays
            const dayMap: Record<string, Weekday> = {
                'SU': RRule.SU,
                'MO': RRule.MO,
                'TU': RRule.TU,
                'WE': RRule.WE,
                'TH': RRule.TH,
                'FR': RRule.FR,
                'SA': RRule.SA
            }
            const weekday = dayMap[pattern.byday]
            if (weekday !== undefined) {
                options.byweekday = [weekday]
            }
        }

        if (pattern.freq === 'MONTHLY' && pattern.bymonthday) {
            options.bymonthday = [pattern.bymonthday]
        }

        const rule = new RRule(options)
        const dates = rule.all()

        if (dates.length < 2) {
            // Try to get at least the next occurrence after fromDate
            const nextRule = new RRule({
                ...options,
                dtstart: new Date(fromDate.getTime() + 24 * 60 * 60 * 1000), // Start from tomorrow
                count: 1
            })
            const nextDates = nextRule.all()
            if (nextDates.length > 0) {
                const nextDate = nextDates[0]
                // Preserve time if specified
                if (pattern.time) {
                    const [hours, minutes] = pattern.time.split(':').map(Number)
                    nextDate.setHours(hours, minutes, 0, 0)
                }
                return nextDate.toISOString()
            }
            return null
        }

        // Get the second occurrence (first is the original date)
        const nextDate = dates[1]
        
        // Preserve time if specified in pattern
        if (pattern.time) {
            const [hours, minutes] = pattern.time.split(':').map(Number)
            nextDate.setHours(hours, minutes, 0, 0)
        } else {
            // Preserve original time if no time in pattern
            nextDate.setHours(fromDate.getHours(), fromDate.getMinutes(), fromDate.getSeconds(), fromDate.getMilliseconds())
        }

        return nextDate.toISOString()
    } catch (error) {
        console.error('Error calculating next occurrence:', error)
        return null
    }
}

/**
 * Calculate next occurrence from a recurrence rule string
 */
export function getNextOccurrenceFromRule(rule: string, fromDate: Date): string | null {
    const pattern = parseRecurrenceRule(rule)
    if (!pattern) return null
    return getNextOccurrence(pattern, fromDate)
}

