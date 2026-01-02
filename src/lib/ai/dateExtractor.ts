/**
 * Extract due date from natural language input
 * Uses chrono-node for robust date parsing
 */

import * as chrono from 'chrono-node'

export interface ExtractedDate {
    title: string
    dueDateISO?: string
    time?: string
}

/**
 * Extract date from input and clean title
 * Examples:
 * - "ride to toronto on 3rd jan 2026" -> { title: "ride to toronto", dueDateISO: "2026-01-03T00:00:00Z" }
 * - "buy milk tomorrow 7pm" -> { title: "buy milk", dueDateISO: "2026-01-04T19:00:00Z" }
 */
export function extractDueDate(input: string): ExtractedDate {
    // Parse with chrono
    const results = chrono.parse(input)
    
    if (results.length === 0) {
        // No date found
        return { title: input.trim() }
    }
    
    // Use first date found
    const dateResult = results[0]
    const parsedDate = dateResult.start.date()
    
    // Extract time if available
    let time: string | undefined
    if (dateResult.start.get('hour') !== null && dateResult.start.get('minute') !== null) {
        const hours = String(dateResult.start.get('hour')).padStart(2, '0')
        const minutes = String(dateResult.start.get('minute')).padStart(2, '0')
        time = `${hours}:${minutes}`
    }
    
    // Remove date text from title
    let cleanedTitle = input
    if (dateResult.text) {
        // Remove the date phrase from title
        cleanedTitle = input.replace(dateResult.text, '').trim()
        // Clean up extra spaces and common words
        cleanedTitle = cleanedTitle
            .replace(/\s+on\s+/gi, ' ')
            .replace(/\s+at\s+/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim()
    }
    
    // Convert to ISO string (use UTC to avoid timezone issues)
    let dueDateISO: string
    if (time) {
        // Include time - create date with time in UTC
        const [hours, minutes] = time.split(':')
        const dateWithTime = new Date(parsedDate)
        dateWithTime.setUTCHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
        dueDateISO = dateWithTime.toISOString()
    } else {
        // All-day (midnight UTC) - use date at start of day in UTC
        const dateAtMidnight = new Date(parsedDate)
        dateAtMidnight.setUTCHours(0, 0, 0, 0)
        dueDateISO = dateAtMidnight.toISOString()
    }
    
    return {
        title: cleanedTitle || input.trim(),
        dueDateISO,
        time,
    }
}

