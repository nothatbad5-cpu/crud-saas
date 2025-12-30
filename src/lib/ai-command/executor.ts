/**
 * Execute validated actions against the database
 * Reuses existing CRUD logic and enforces user permissions
 */

import { createClient } from '@/lib/supabase/server'
import { canCreateTask } from '@/lib/usage'
import { combineDateTimeToISO, extractDateFromDueAt } from '@/lib/datetime-utils'
import { Action } from './schema'

interface ExecutionResult {
    success: boolean
    message: string
    affectedCount: number
}

export async function executeActions(userId: string, actions: Action[]): Promise<ExecutionResult> {
    const supabase = await createClient()
    let totalAffected = 0
    const messages: string[] = []
    
    for (const action of actions) {
        if (action.type === 'noop') {
            messages.push(`Skipped: ${action.reason}`)
            continue
        }
        
        if (action.type === 'create') {
            // Check usage limits
            const { allowed, reason } = await canCreateTask(userId)
            if (!allowed) {
                return {
                    success: false,
                    message: reason || 'Cannot create task: limit reached',
                    affectedCount: totalAffected,
                }
            }
            
            // Parse due date if provided
            let due_at: string | null = null
            let due_date: string | null = null
            
            if (action.dueDate) {
                // Try to parse as ISO date first
                if (/^\d{4}-\d{2}-\d{2}$/.test(action.dueDate)) {
                    due_at = combineDateTimeToISO(action.dueDate, null, true)
                    due_date = action.dueDate
                } else {
                    // Try to parse natural language dates
                    const lower = action.dueDate.toLowerCase()
                    const today = new Date()
                    let targetDate = new Date(today)
                    
                    if (lower.includes('tomorrow')) {
                        targetDate.setDate(today.getDate() + 1)
                    } else if (lower.includes('today')) {
                        targetDate = today
                    } else if (lower.includes('next friday') || lower.includes('friday')) {
                        const dayOfWeek = today.getDay()
                        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
                        targetDate.setDate(today.getDate() + daysUntilFriday)
                    } else if (lower.includes('next week')) {
                        targetDate.setDate(today.getDate() + 7)
                    } else if (lower.includes('next month')) {
                        targetDate.setMonth(today.getMonth() + 1)
                    }
                    
                    due_date = targetDate.toISOString().split('T')[0]
                    due_at = combineDateTimeToISO(due_date, null, true)
                }
            }
            
            const { error } = await supabase.from('tasks').insert({
                title: action.title,
                description: action.description || null,
                status: action.status || 'pending',
                due_date,
                due_at,
                user_id: userId,
            })
            
            if (error) {
                return {
                    success: false,
                    message: `Failed to create task: ${error.message}`,
                    affectedCount: totalAffected,
                }
            }
            
            totalAffected++
            messages.push(`Created task: "${action.title}"`)
        }
        
        if (action.type === 'update') {
            // Find matching tasks
            let query = supabase.from('tasks').select('id, title').eq('user_id', userId)
            
            if (action.match.id) {
                query = query.eq('id', action.match.id)
            } else if (action.match.title) {
                // Try exact match first
                query = query.ilike('title', action.match.title)
            } else {
                return {
                    success: false,
                    message: 'Update action requires id or title to match',
                    affectedCount: totalAffected,
                }
            }
            
            const { data: tasks, error: fetchError } = await query
            
            if (fetchError) {
                return {
                    success: false,
                    message: `Failed to find tasks: ${fetchError.message}`,
                    affectedCount: totalAffected,
                }
            }
            
            if (!tasks || tasks.length === 0) {
                return {
                    success: false,
                    message: `No task found matching: ${action.match.title || action.match.id}`,
                    affectedCount: totalAffected,
                }
            }
            
            if (tasks.length > 1 && !action.match.id) {
                // Multiple matches - return error asking for specificity
                return {
                    success: false,
                    message: `Multiple tasks match "${action.match.title}". Please be more specific or use the task ID.`,
                    affectedCount: totalAffected,
                }
            }
            
            // Build update data
            const updateData: any = {}
            
            if (action.patch.title) {
                updateData.title = action.patch.title
            }
            if (action.patch.description !== undefined) {
                updateData.description = action.patch.description || null
            }
            if (action.patch.status) {
                updateData.status = action.patch.status
            }
            if (action.patch.dueDate !== undefined) {
                if (action.patch.dueDate === null) {
                    updateData.due_date = null
                    updateData.due_at = null
                } else {
                    // Parse date
                    if (/^\d{4}-\d{2}-\d{2}$/.test(action.patch.dueDate)) {
                        updateData.due_at = combineDateTimeToISO(action.patch.dueDate, null, true)
                        updateData.due_date = action.patch.dueDate
                    } else {
                        // Try to parse natural language dates
                        const lower = action.patch.dueDate.toLowerCase()
                        const today = new Date()
                        let targetDate = new Date(today)
                        
                        if (lower.includes('tomorrow')) {
                            targetDate.setDate(today.getDate() + 1)
                        } else if (lower.includes('today')) {
                            targetDate = today
                        } else if (lower.includes('next friday') || lower.includes('friday')) {
                            const dayOfWeek = today.getDay()
                            const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
                            targetDate.setDate(today.getDate() + daysUntilFriday)
                        } else if (lower.includes('next week')) {
                            targetDate.setDate(today.getDate() + 7)
                        } else if (lower.includes('next month')) {
                            targetDate.setMonth(today.getMonth() + 1)
                        }
                        
                        updateData.due_date = targetDate.toISOString().split('T')[0]
                        updateData.due_at = combineDateTimeToISO(updateData.due_date, null, true)
                    }
                }
            }
            
            // Update all matched tasks
            const { error: updateError } = await supabase
                .from('tasks')
                .update(updateData)
                .in('id', tasks.map(t => t.id))
            
            if (updateError) {
                return {
                    success: false,
                    message: `Failed to update task: ${updateError.message}`,
                    affectedCount: totalAffected,
                }
            }
            
            totalAffected += tasks.length
            messages.push(`Updated ${tasks.length} task(s)`)
        }
        
        if (action.type === 'delete') {
            // Find matching tasks with smart matching
            let tasks: any[] = []
            
            if (action.match.id) {
                // Direct ID match
                const { data, error: fetchError } = await supabase
                    .from('tasks')
                    .select('id, title')
                    .eq('user_id', userId)
                    .eq('id', action.match.id)
                    .limit(1)
                
                if (fetchError) {
                    return {
                        success: false,
                        message: `Failed to find tasks: ${fetchError.message}`,
                        affectedCount: totalAffected,
                    }
                }
                
                tasks = data || []
            } else if (action.match.title) {
                // Smart title matching: exact -> case-insensitive exact -> contains (only if single result)
                const title = action.match.title.trim()
                
                // 1. Try exact match (case-sensitive)
                let { data, error: fetchError } = await supabase
                    .from('tasks')
                    .select('id, title')
                    .eq('user_id', userId)
                    .eq('title', title)
                    .limit(action.limit || 100)
                
                if (fetchError) {
                    return {
                        success: false,
                        message: `Failed to find tasks: ${fetchError.message}`,
                        affectedCount: totalAffected,
                    }
                }
                
                if (data && data.length > 0) {
                    tasks = data
                } else {
                    // 2. Try case-insensitive exact match
                    const { data: data2, error: fetchError2 } = await supabase
                        .from('tasks')
                        .select('id, title')
                        .eq('user_id', userId)
                        .ilike('title', title)
                        .limit(action.limit || 100)
                    
                    if (fetchError2) {
                        return {
                            success: false,
                            message: `Failed to find tasks: ${fetchError2.message}`,
                            affectedCount: totalAffected,
                        }
                    }
                    
                    if (data2 && data2.length > 0) {
                        tasks = data2
                    } else {
                        // 3. Try contains match (only if single result expected)
                        const { data: data3, error: fetchError3 } = await supabase
                            .from('tasks')
                            .select('id, title')
                            .eq('user_id', userId)
                            .ilike('title', `%${title}%`)
                            .limit(action.limit || 100)
                        
                        if (fetchError3) {
                            return {
                                success: false,
                                message: `Failed to find tasks: ${fetchError3.message}`,
                                affectedCount: totalAffected,
                            }
                        }
                        
                        tasks = data3 || []
                    }
                }
            } else {
                return {
                    success: false,
                    message: 'Delete action requires id or title to match',
                    affectedCount: totalAffected,
                }
            }
            
            // Check for multiple matches (requires confirmation)
            if (tasks.length > 1 && !action.match.id) {
                return {
                    success: false,
                    message: `Multiple tasks match "${action.match.title}". Please be more specific or use the task ID.`,
                    affectedCount: totalAffected,
                }
            }
            
            if (tasks.length === 0) {
                return {
                    success: false,
                    message: `No task found matching: ${action.match.title || action.match.id}`,
                    affectedCount: totalAffected,
                }
            }
            
            // Delete all matched tasks
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .in('id', tasks.map(t => t.id))
            
            if (deleteError) {
                return {
                    success: false,
                    message: `Failed to delete task: ${deleteError.message}`,
                    affectedCount: totalAffected,
                }
            }
            
            totalAffected += tasks.length
            messages.push(`Deleted ${tasks.length} task(s)`)
        }
        
        if (action.type === 'bulk_delete_all') {
            // Delete all user's tasks
            const { error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .eq('user_id', userId)
            
            if (deleteError) {
                return {
                    success: false,
                    message: `Failed to delete all tasks: ${deleteError.message}`,
                    affectedCount: totalAffected,
                }
            }
            
            // Count deleted (approximate)
            totalAffected++
            messages.push('Deleted all tasks')
        }
    }
    
    return {
        success: true,
        message: messages.join('. ') || 'No actions executed',
        affectedCount: totalAffected,
    }
}

