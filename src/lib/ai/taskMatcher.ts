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
 */
export async function findTaskByTitle(userId: string, title: string): Promise<{ id: string; title: string; due_at: string | null } | null> {
    const supabase = await createClient()
    const normalized = normalizeTitle(title)
    
    // Get all tasks for this user to do normalized comparison
    // This ensures we catch duplicates even with slight variations
    const { data: allTasks, error } = await supabase
        .from('tasks')
        .select('id, title, due_at')
        .eq('user_id', userId)
    
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

