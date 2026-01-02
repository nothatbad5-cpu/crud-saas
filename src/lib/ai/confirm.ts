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
 */
export async function checkAmbiguousDeletes(userId: string, actions: Action[]): Promise<{
    isAmbiguous: boolean
    message?: string
}> {
    const supabase = await createClient()
    
    for (const action of actions) {
        if (action.type === 'delete' && action.match.title && !action.match.id) {
            const title = action.match.title.trim()
            
            // Check for multiple matches - filter by user_id ONLY
            const { data: tasks } = await supabase
                .from('tasks')
                .select('id, title')
                .eq('user_id', userId)
                .ilike('title', `%${title}%`)
                .limit(10)
            
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

