/**
 * Task matching and normalization utilities
 * Prevents duplicate tasks by normalizing titles and checking for existing tasks
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Normalize a task title for comparison
 * - Trim whitespace
 * - Convert to lowercase
 * - Collapse multiple spaces to single space
 */
export function normalizeTitle(title: string): string {
    return title.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Find existing task by normalized title
 * Returns the first matching task or null
 */
export async function findTaskByTitle(userId: string, title: string): Promise<{ id: string; title: string; due_at: string | null } | null> {
    const supabase = await createClient()
    const normalized = normalizeTitle(title)
    
    // Try exact match first (case-insensitive)
    const { data: exactMatch, error: exactError } = await supabase
        .from('tasks')
        .select('id, title, due_at')
        .eq('user_id', userId)
        .ilike('title', normalized)
        .limit(1)
        .single()
    
    if (!exactError && exactMatch) {
        return exactMatch
    }
    
    // Try contains match (only if it results in a single match)
    const { data: containsMatches, error: containsError } = await supabase
        .from('tasks')
        .select('id, title, due_at')
        .eq('user_id', userId)
        .ilike('title', `%${normalized}%`)
        .limit(2)
    
    if (!containsError && containsMatches && containsMatches.length === 1) {
        return containsMatches[0]
    }
    
    return null
}

/**
 * Check if a normalized title matches an existing task
 */
export async function taskExists(userId: string, title: string): Promise<boolean> {
    const task = await findTaskByTitle(userId, title)
    return task !== null
}

