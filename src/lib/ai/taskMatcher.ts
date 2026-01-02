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
 * Uses exact normalized match for reliable duplicate detection
 * Supports both authenticated users (user_id) and guests (guest_id)
 */
export async function findTaskByTitle(identityId: string, title: string, isGuest: boolean = false): Promise<{ id: string; title: string; due_at: string | null } | null> {
    const supabase = await createClient()
    const normalized = normalizeTitle(title)
    
    // Get all tasks for this identity (user_id OR guest_id) to do normalized comparison
    let query = supabase
        .from('tasks')
        .select('id, title, due_at')
    
    if (isGuest) {
        query = query.eq('guest_id', identityId)
    } else {
        query = query.eq('user_id', identityId)
    }
    
    const { data: allTasks, error } = await query
    
    if (error || !allTasks) {
        return null
    }
    
    // Find exact normalized match
    for (const task of allTasks) {
        if (normalizeTitle(task.title) === normalized) {
            return task
        }
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

