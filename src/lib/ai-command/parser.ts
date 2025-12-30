/**
 * Rule-based parser for natural language task commands
 * Used as fallback when AI provider is not configured
 */

import { Action } from './schema'

interface ParseResult {
    actions: Action[]
    preview: string
    requiresConfirm: boolean
}

export function parseCommand(input: string): ParseResult {
    const normalized = input.trim().toLowerCase()
    
    // Extract command verb and arguments
    const words = normalized.split(/\s+/)
    const verb = words[0]
    
    // CREATE/ADD commands
    if (verb === 'add' || verb === 'create' || verb === 'new') {
        const title = words.slice(1).join(' ').trim()
        if (!title) {
            return {
                actions: [{ type: 'noop', reason: 'Please provide a task title. Example: "add buy milk"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        // Check for date/time keywords
        let dueDate: string | undefined
        const tomorrowIndex = words.findIndex(w => w === 'tomorrow')
        const todayIndex = words.findIndex(w => w === 'today')
        
        if (tomorrowIndex !== -1) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            dueDate = tomorrow.toISOString().split('T')[0]
            // Remove "tomorrow" from title
            words.splice(tomorrowIndex, 1)
        } else if (todayIndex !== -1) {
            dueDate = new Date().toISOString().split('T')[0]
            words.splice(todayIndex, 1)
        }
        
        const cleanTitle = words.slice(1).join(' ').trim()
        
        return {
            actions: [{
                type: 'create',
                title: cleanTitle,
                dueDate,
            }],
            preview: 'Create task: "' + cleanTitle + '"' + (dueDate ? ' (due: ' + dueDate + ')' : ''),
            requiresConfirm: false,
        }
    }
    
    // DELETE/REMOVE commands
    if (verb === 'delete' || verb === 'remove' || verb === 'rm') {
        // Check for "all" or "clear all"
        if (normalized.includes('all') || normalized.includes('clear all')) {
            return {
                actions: [{ type: 'bulk_delete_all' }],
                preview: 'Delete all tasks',
                requiresConfirm: true,
            }
        }
        
        // Extract title (everything after "delete"/"remove")
        const title = words.slice(1).join(' ').trim()
        if (!title) {
            return {
                actions: [{ type: 'noop', reason: 'Please specify which task to delete. Example: "delete buy milk"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        // Remove "the" and "task" keywords
        const cleanTitle = title.replace(/^(the|task)\s+/i, '').trim()
        
        return {
            actions: [{
                type: 'delete',
                match: { title: cleanTitle },
            }],
            preview: 'Delete task matching: "' + cleanTitle + '"',
            requiresConfirm: cleanTitle.length < 5, // Require confirm for short/ambiguous matches
        }
    }
    
    // MARK/COMPLETE commands
    if (verb === 'mark' || verb === 'complete' || verb === 'finish' || verb === 'done') {
        const status = normalized.includes('complete') || normalized.includes('done') || normalized.includes('finish')
            ? 'completed'
            : normalized.includes('pending') || normalized.includes('incomplete')
            ? 'pending'
            : null
        
        if (!status) {
            return {
                actions: [{ type: 'noop', reason: 'Please specify status: "mark X complete" or "mark X pending"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        // Extract title (everything after status keyword)
        const statusKeyword = status === 'completed' ? 'complete' : 'pending'
        const statusIndex = words.findIndex(w => w === statusKeyword || w === 'as')
        const title = statusIndex !== -1 
            ? words.slice(statusIndex + 1).join(' ').trim()
            : words.slice(1).join(' ').trim()
        
        if (!title) {
            return {
                actions: [{ type: 'noop', reason: 'Please specify which task to mark as ' + status + '. Example: "mark buy milk complete"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        const cleanTitle = title.replace(/^(the|task)\s+/i, '').trim()
        
        const statusText = status === 'completed' ? 'complete' : 'pending'
        return {
            actions: [{
                type: 'update',
                match: { title: cleanTitle },
                patch: { status },
            }],
            preview: 'Mark "' + cleanTitle + '" as ' + statusText,
            requiresConfirm: false,
        }
    }
    
    // RENAME commands
    if (verb === 'rename' || verb === 'change') {
        const toIndex = words.findIndex(w => w === 'to')
        if (toIndex === -1) {
            return {
                actions: [{ type: 'noop', reason: 'Please specify new title. Example: "rename buy milk to buy almond milk"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        const oldTitle = words.slice(1, toIndex).join(' ').trim()
        const newTitle = words.slice(toIndex + 1).join(' ').trim()
        
        if (!oldTitle || !newTitle) {
            return {
                actions: [{ type: 'noop', reason: 'Please provide both old and new titles. Example: "rename buy milk to buy almond milk"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        return {
            actions: [{
                type: 'update',
                match: { title: oldTitle },
                patch: { title: newTitle },
            }],
            preview: 'Rename "' + oldTitle + '" to "' + newTitle + '"',
            requiresConfirm: false,
        }
    }
    
    // SET DUE DATE commands
    if (verb === 'set' && (normalized.includes('due') || normalized.includes('date'))) {
        const forIndex = words.findIndex(w => w === 'for')
        const toIndex = words.findIndex(w => w === 'to')
        const targetIndex = forIndex !== -1 ? forIndex : toIndex
        
        if (targetIndex === -1) {
            return {
                actions: [{ type: 'noop', reason: 'Please specify task and date. Example: "set due date for buy milk to next friday"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        const title = words.slice(targetIndex + 1, words.length - 2).join(' ').trim() // Everything between "for" and last 2 words (date keywords)
        const dateKeywords = words.slice(-2).join(' ')
        
        // Simple date parsing (can be enhanced)
        let dueDate: string | undefined
        if (dateKeywords.includes('tomorrow')) {
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            dueDate = tomorrow.toISOString().split('T')[0]
        } else if (dateKeywords.includes('today')) {
            dueDate = new Date().toISOString().split('T')[0]
        } else if (dateKeywords.includes('friday')) {
            // Next Friday
            const date = new Date()
            const dayOfWeek = date.getDay()
            const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
            date.setDate(date.getDate() + daysUntilFriday)
            dueDate = date.toISOString().split('T')[0]
        }
        
        if (!title || !dueDate) {
            return {
                actions: [{ type: 'noop', reason: 'Could not parse date. Try: "set due date for buy milk to tomorrow"' }],
                preview: 'Could not understand command',
                requiresConfirm: false,
            }
        }
        
        return {
            actions: [{
                type: 'update',
                match: { title },
                patch: { dueDate },
            }],
            preview: 'Set due date for "' + title + '" to ' + dueDate,
            requiresConfirm: false,
        }
    }
    
    // Default: noop
    return {
        actions: [{
            type: 'noop',
            reason: 'Could not understand command: "' + input + '". Try: "add buy milk", "delete buy milk", "mark buy milk complete", "rename buy milk to buy almond milk", or "set due date for buy milk to tomorrow"',
        }],
        preview: 'Could not understand command',
        requiresConfirm: false,
    }
}

