/**
 * Extract due date from natural language input
 * Uses chrono-node for robust date parsing
 * 
 * CRITICAL: Enforces future dates for relative terms (tomorrow, today, next, etc.)
 * to prevent tasks from being created as overdue.
 */

import * as chrono from 'chrono-node'

export interface ExtractedDate {
    title: string
    dueDateISO?: string
    time?: string
}

/**
 * Detect if input contains explicit past date references
 * Examples: "Oct 4 2023", "last Friday", "2023-10-05"
 */
function hasExplicitPastDate(input: string): boolean {
    const inputLower = input.toLowerCase()
    
    // Check for explicit year in past
    const yearMatch = input.match(/\b(19\d{2}|20[0-2]\d)\b/)
    if (yearMatch) {
        const year = parseInt(yearMatch[1])
        const currentYear = new Date().getFullYear()
        if (year < currentYear) {
            return true
        }
    }
    
    // Check for "last" + day/week/month
    if (/\blast\s+(friday|saturday|sunday|monday|tuesday|wednesday|thursday|week|month|year)\b/i.test(input)) {
        return true
    }
    
    // Check for explicit past dates like "Oct 4 2023"
    if (/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}\s+20[0-2]\d\b/i.test(input)) {
        const dateMatch = input.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})\s+(20[0-2]\d)\b/i)
        if (dateMatch) {
            const year = parseInt(dateMatch[3])
            const currentYear = new Date().getFullYear()
            if (year < currentYear) {
                return true
            }
        }
    }
    
    return false
}

/**
 * Get start of tomorrow in local timezone
 */
function getStartOfTomorrow(): Date {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    return tomorrow
}

/**
 * Get start of today in local timezone
 */
function getStartOfToday(): Date {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
}

/**
 * Extract due date from input and clean title
 * Examples:
 * - "ride to toronto on 3rd jan 2026" -> { title: "ride to toronto", dueDateISO: "2026-01-03T00:00:00Z" }
 * - "buy milk tomorrow 7pm" -> { title: "buy milk", dueDateISO: "2026-01-04T19:00:00Z" }
 * 
 * CRITICAL: Relative terms (tomorrow, today, next) NEVER resolve to past dates.
 */
export function extractDueDate(input: string): ExtractedDate {
    // CRITICAL: Use current date as reference so "tomorrow" resolves correctly
    const referenceDate = new Date()
    const now = new Date()
    
    // Detect relative keywords
    const inputLower = input.toLowerCase()
    const relativeKeywords = ['tomorrow', 'today', 'tonight', 'next', 'this']
    const detectedKeywords: string[] = []
    
    for (const keyword of relativeKeywords) {
        if (inputLower.includes(keyword)) {
            detectedKeywords.push(keyword)
        }
    }
    
    // Check if input has explicit past date (allowed)
    const hasExplicitPast = hasExplicitPastDate(input)
    
    // Parse with chrono, passing reference date
    const results = chrono.parse(input, referenceDate)
    
    if (results.length === 0) {
        // No date found
        return { title: input.trim() }
    }
    
    // Use first date found
    const dateResult = results[0]
    let parsedDate = dateResult.start.date()
    const originalParsedDate = new Date(parsedDate)
    
    // Extract time if available (BEFORE fixing date)
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
    
    // CRITICAL: Enforce future dates for relative terms
    if (detectedKeywords.length > 0 && !hasExplicitPast) {
        const hasRelativeTerm = detectedKeywords.length > 0
        
        if (hasRelativeTerm) {
            // Force future date based on detected keyword
            if (inputLower.includes('tomorrow')) {
                // "tomorrow" → start of tomorrow
                parsedDate = getStartOfTomorrow()
            } else if (inputLower.includes('tonight')) {
                // "tonight" → today, evening (default to 6pm if no time specified)
                parsedDate = getStartOfToday()
                if (!time) {
                    time = '18:00' // Default to 6pm for "tonight"
                }
            } else if (inputLower.includes('today')) {
                // "today" → keep same date, allow past times
                parsedDate = getStartOfToday()
            } else if (inputLower.includes('next week')) {
                // "next week" → now + 7 days minimum
                parsedDate = new Date(now)
                parsedDate.setDate(parsedDate.getDate() + 7)
                parsedDate.setHours(0, 0, 0, 0)
            } else if (inputLower.includes('next')) {
                // Generic "next" → ensure future
                if (parsedDate < now) {
                    // If parsed date is in past, add 1 day minimum
                    parsedDate = new Date(now)
                    parsedDate.setDate(parsedDate.getDate() + 1)
                    parsedDate.setHours(0, 0, 0, 0)
                }
            } else if (inputLower.includes('this')) {
                // "this week", "this month" → ensure future
                if (parsedDate < now) {
                    // If parsed date is in past, set to today
                    parsedDate = getStartOfToday()
                }
            }
        }
    }
    
    // Apply time AFTER fixing the date
    let finalDate: Date
    if (time) {
        const [hours, minutes] = time.split(':')
        finalDate = new Date(parsedDate)
        finalDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
    } else {
        // All-day (midnight local time)
        finalDate = new Date(parsedDate)
        finalDate.setHours(0, 0, 0, 0)
    }
    
    // SAFETY GUARD: If still in past and no explicit past date → set to now + 1 hour
    if (finalDate < now && !hasExplicitPast && detectedKeywords.length > 0) {
        finalDate = new Date(now)
        finalDate.setHours(finalDate.getHours() + 1)
        finalDate.setMinutes(0, 0, 0)
        
        // Update time if it was set
        if (time) {
            const [hours, minutes] = time.split(':')
            finalDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
            // If the time is still in past, set to next hour
            if (finalDate < now) {
                finalDate.setHours(finalDate.getHours() + 1)
            }
        }
    }
    
    const dueDateISO = finalDate.toISOString()
    
    // Development logging
    if (process.env.NODE_ENV === 'development') {
        console.log('[dateExtractor] Parsed date:', {
            input,
            detectedKeywords,
            hasExplicitPast,
            originalParsedDate: originalParsedDate.toISOString(),
            finalParsedDate: dueDateISO,
            time,
            referenceDate: referenceDate.toISOString(),
            now: now.toISOString(),
            wasFixed: originalParsedDate.getTime() !== finalDate.getTime(),
        })
    }
    
    return {
        title: cleanedTitle || input.trim(),
        dueDateISO,
        time,
    }
}
