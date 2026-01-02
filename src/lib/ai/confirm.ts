/**
 * Single source of truth for determining if actions require confirmation
 * Only destructive actions require confirmation
 */

import { Action } from '@/lib/ai-command/schema'
import { createClient } from '@/lib/supabase/server'

/**
 * Compute whether actions require confirmation
 * Only destructive actions (delete, bulk_delete_all) require confirmation
 */
export function computeRequiresConfirm(actions: Action[]): boolean {
    return actions.some(a => 
        a.type === 'delete' || 
        a.type === 'bulk_delete_all'
    )
}

/**
 * Check if delete actions have ambiguous matches (multiple tasks)
 * Returns true if any delete action would match multiple tasks
 * Supports both authenticated users (user_id) and guests (guest_id)
 */
export async function checkAmbiguousDeletes(identityId: string, actions: Action[], isGuest: boolean = false): Promise<{
    isAmbiguous: boolean
    message?: string
}> {
    const supabase = await createClient()
    
    for (const action of actions) {
        if (action.type === 'delete' && action.match.title && !action.match.id) {
            const title = action.match.title.trim()
            
            // Check for multiple matches - use user_id OR guest_id
            let query = supabase
                .from('tasks')
                .select('id, title')
                .ilike('title', `%${title}%`)
                .limit(10)
            
            if (isGuest) {
                query = query.eq('guest_id', identityId)
            } else {
                query = query.eq('user_id', identityId)
            }
            
            const { data: tasks } = await query
            
            if (tasks && tasks.length > 1) {
                const taskTitles = tasks.map(t => t.title).slice(0, 5)
                return {
                    isAmbiguous: true,
                    message: `Multiple tasks match "${title}": ${taskTitles.join(', ')}${tasks.length > 5 ? '...' : ''}. Please be more specific.`,
                }
            }
        }
    }
    
    return { isAmbiguous: false }
}

