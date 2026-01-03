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
 * 
 * CRITICAL: Always uses current date as reference to ensure "tomorrow" resolves correctly.
 * Guards against past dates when relative terms are used.
 */
export function extractDueDate(input: string): ExtractedDate {
    // CRITICAL: Use current date as reference so "tomorrow" resolves correctly
    const referenceDate = new Date()
    
    // Parse with chrono, passing reference date
    const results = chrono.parse(input, referenceDate, { forwardDate: true })
    
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
    
    // Convert to ISO string (use local timezone, then convert to UTC)
    let dueDateISO: string
    if (time) {
        // Include time - create date with time in local timezone
        const [hours, minutes] = time.split(':')
        const dateWithTime = new Date(parsedDate)
        dateWithTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
        dueDateISO = dateWithTime.toISOString()
    } else {
        // All-day (midnight local time) - use date at start of day in local timezone
        const dateAtMidnight = new Date(parsedDate)
        dateAtMidnight.setHours(0, 0, 0, 0)
        dueDateISO = dateAtMidnight.toISOString()
    }
    
    // GUARD: Prevent past dates when relative terms are used
    // Check if input contains relative terms (tomorrow, today)
    const inputLower = input.toLowerCase()
    const hasRelativeTerm = /\b(tomorrow|today)\b/.test(inputLower)
    
    if (hasRelativeTerm) {
        const parsedDateObj = new Date(dueDateISO)
        const now = new Date()
        
        // If parsed date is in the past and input contains "tomorrow", recalculate correctly
        if (inputLower.includes('tomorrow') && parsedDateObj < now) {
            // Calculate tomorrow from reference date (today)
            const tomorrow = new Date(referenceDate)
            tomorrow.setDate(tomorrow.getDate() + 1)
            
            // Apply time if it was set, otherwise use start of day
            if (time) {
                const [hours, minutes] = time.split(':')
                tomorrow.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
            } else {
                tomorrow.setHours(0, 0, 0, 0)
            }
            
            dueDateISO = tomorrow.toISOString()
            
            // Log for debugging (only in development)
            if (process.env.NODE_ENV === 'development') {
                console.log('[dateExtractor] Fixed past "tomorrow" date:', {
                    input,
                    original: parsedDateObj.toISOString(),
                    corrected: dueDateISO,
                    referenceDate: referenceDate.toISOString(),
                    time,
                })
            }
        }
        
        // If parsed date is in the past and input contains "today", allow it
        // (For "today 7am" at 8am, we allow it as "today" - user may want to complete it today even if time passed)
        // This is acceptable behavior - no correction needed for "today"
    }
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
        console.log('[dateExtractor] Parsed date:', {
            input,
            referenceDate: referenceDate.toISOString(),
            parsedDueAt: dueDateISO,
            parsedDueAtLocal: new Date(dueDateISO).toLocaleString(),
            time,
        })
    }
    
    return {
        title: cleanedTitle || input.trim(),
        dueDateISO,
        time,
    }
}

