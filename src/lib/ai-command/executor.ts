/**
 * Execute validated actions against the database
 * Reuses existing CRUD logic and enforces user permissions
 */

import { createClient } from '@/lib/supabase/server'
import { canCreateTask } from '@/lib/usage'
import { combineDateTimeToISO, extractDateFromDueAt } from '@/lib/datetime-utils'
import { extractDueDate } from '@/lib/ai/dateExtractor'
import { Action } from './schema'

interface ExecutionResult {
    success: boolean
    message: string
    affectedCount: number
    results: Array<{
        type: string
        ok: boolean
        id?: string
        title?: string
        due_at?: string | null
        error?: string
    }>
}

export async function executeActions(userId: string | null, actions: Action[], guestId?: string | null): Promise<ExecutionResult> {
    const supabase = await createClient()
    let totalAffected = 0
    const messages: string[] = []
    const results: ExecutionResult['results'] = []
    
    // Determine identity: use userId if provided, else guestId
    const identityId = userId || guestId
    const isGuest = !userId && !!guestId
    
    if (!identityId) {
        return {
            success: false,
            message: 'No user or guest identity',
            affectedCount: 0,
            results: [{
                type: 'create',
                ok: false,
                error: 'No user or guest identity'
            }]
        }
    }
    
    for (const action of actions) {
        if (action.type === 'noop') {
            messages.push(`Skipped: ${action.reason}`)
            continue
        }
        
        if (action.type === 'create') {
            // Check usage limits (only for authenticated users, not guests)
            if (!isGuest && userId) {
                const { allowed, reason } = await canCreateTask(userId)
                if (!allowed) {
                    results.push({
                        type: 'create',
                        ok: false,
                        title: action.title,
                        error: reason || 'Cannot create task: limit reached'
                    })
                    return {
                        success: false,
                        message: reason || 'Cannot create task: limit reached',
                        affectedCount: totalAffected,
                        results
                    }
                }
            }
            
            // Parse due date if provided - use chrono-node for deterministic parsing
            let due_at: string | null = null
            let due_date: string | null = null
            
            if (action.dueDate) {
                // Check if it's already an ISO string (from AI or dateExtractor)
                if (action.dueDate.includes('T') || action.dueDate.includes('Z')) {
                    // Already ISO format (e.g., "2026-01-03T00:00:00Z" or "2026-01-03T15:00:00Z")
                    try {
                        const date = new Date(action.dueDate)
                        if (!isNaN(date.getTime())) {
                            due_at = date.toISOString()
                            due_date = extractDateFromDueAt(due_at)
                        }
                    } catch (e) {
                        console.error('Failed to parse ISO date:', action.dueDate, e)
                    }
                } else if (/^\d{4}-\d{2}-\d{2}$/.test(action.dueDate)) {
                    // YYYY-MM-DD format
                    due_at = combineDateTimeToISO(action.dueDate, null, true)
                    due_date = action.dueDate
                } else {
                    // Use chrono-node for deterministic natural language parsing
                    const extracted = extractDueDate(action.dueDate)
                    if (extracted.dueDateISO) {
                        try {
                            const date = new Date(extracted.dueDateISO)
                            if (!isNaN(date.getTime())) {
                                due_at = date.toISOString()
                                due_date = extractDateFromDueAt(due_at)
                            }
                        } catch (e) {
                            console.error('Failed to parse extracted date:', extracted.dueDateISO, e)
                        }
                    }
                }
            }
            
            const insertData: any = {
                title: action.title,
                description: action.description || null,
                status: action.status || 'pending',
                due_date,
                due_at,
                user_id: isGuest ? null : userId,
                guest_id: isGuest ? guestId : null,
            }

            // Add recurrence fields if provided
            if (action.recurrenceRule) {
                insertData.recurrence_rule = action.recurrenceRule
                insertData.recurrence_timezone = action.recurrenceTimezone || 'UTC'
            }

            // Insert and verify the task was actually created - MUST return full row
            // Note: guest_id may not be in TypeScript types but exists in DB
            const { data: insertedTask, error } = await supabase
                .from('tasks')
                .insert(insertData)
                .select('id, title, due_at, due_date, created_at, status, user_id')
                .single()
            
            // HARD PROOF: Must have insertedTask with id
            if (error || !insertedTask || !insertedTask.id) {
                const errorMsg = error?.message || 'Insert returned no row'
                console.error('Insert failed:', { error, insertedTask, insertData })
                results.push({
                    type: 'create',
                    ok: false,
                    title: action.title,
                    error: errorMsg
                })
                return {
                    success: false,
                    message: `Failed to create task: ${errorMsg}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            // Verify identity matches (RLS safety check)
            // For guests, verify guest_id matches (may not be in TypeScript types)
            if (isGuest && guestId) {
                const insertedTaskAny = insertedTask as any
                const insertedGuestId = insertedTaskAny.guest_id
                if (insertedGuestId !== guestId) {
                    const errorMsg = 'Inserted task guest_id mismatch - RLS violation'
                    console.error('RLS violation:', { insertedTask, guestId, insertedGuestId })
                    results.push({
                        type: 'create',
                        ok: false,
                        title: action.title,
                        error: errorMsg
                    })
                    return {
                        success: false,
                        message: `Failed to create task: ${errorMsg}`,
                        affectedCount: totalAffected,
                        results
                    }
                }
            } else if (!isGuest && userId) {
                if (insertedTask.user_id !== userId) {
                    const errorMsg = 'Inserted task user_id mismatch - RLS violation'
                    console.error('RLS violation:', { insertedTask, userId })
                    results.push({
                        type: 'create',
                        ok: false,
                        title: action.title,
                        error: errorMsg
                    })
                    return {
                        success: false,
                        message: `Failed to create task: ${errorMsg}`,
                        affectedCount: totalAffected,
                        results
                    }
                }
            }
            
            totalAffected++
            messages.push(`Created task: "${action.title}"`)
            results.push({
                type: 'create',
                ok: true,
                id: insertedTask.id,
                title: insertedTask.title,
                due_at: insertedTask.due_at
            })
        }
        
        if (action.type === 'update') {
            // Find matching tasks - use user_id OR guest_id
            let query = supabase.from('tasks').select('id, title')
            
            if (isGuest && guestId) {
                query = query.eq('guest_id', guestId)
            } else if (!isGuest && userId) {
                query = query.eq('user_id', userId)
            } else {
                results.push({
                    type: 'update',
                    ok: false,
                    error: 'No identity for update'
                })
                return {
                    success: false,
                    message: 'No identity for update',
                    affectedCount: totalAffected,
                    results
                }
            }
            
            if (action.match.id) {
                query = query.eq('id', action.match.id)
            } else if (action.match.title) {
                // Try exact match first
                query = query.ilike('title', action.match.title)
            } else {
                results.push({
                    type: 'update',
                    ok: false,
                    error: 'Update action requires id or title to match'
                })
                return {
                    success: false,
                    message: 'Update action requires id or title to match',
                    affectedCount: totalAffected,
                    results
                }
            }
            
            const { data: tasks, error: fetchError } = await query
            
            if (fetchError) {
                results.push({
                    type: 'update',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: fetchError.message
                })
                return {
                    success: false,
                    message: `Failed to find tasks: ${fetchError.message}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            if (!tasks || tasks.length === 0) {
                results.push({
                    type: 'update',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: 'No task found matching'
                })
                return {
                    success: false,
                    message: `No task found matching: ${action.match.title || action.match.id}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            if (tasks.length > 1 && !action.match.id) {
                // Multiple matches - return error asking for specificity
                results.push({
                    type: 'update',
                    ok: false,
                    title: action.match.title,
                    error: 'Multiple tasks match'
                })
                return {
                    success: false,
                    message: `Multiple tasks match "${action.match.title}". Please be more specific or use the task ID.`,
                    affectedCount: totalAffected,
                    results
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
                    // Check if it's already an ISO string
                    if (action.patch.dueDate.includes('T') || action.patch.dueDate.includes('Z')) {
                        // Already ISO format
                        try {
                            const date = new Date(action.patch.dueDate)
                            if (!isNaN(date.getTime())) {
                                updateData.due_at = date.toISOString()
                                updateData.due_date = extractDateFromDueAt(updateData.due_at)
                            }
                        } catch (e) {
                            console.error('Failed to parse ISO date:', action.patch.dueDate, e)
                        }
                    } else if (/^\d{4}-\d{2}-\d{2}$/.test(action.patch.dueDate)) {
                        // YYYY-MM-DD format
                        updateData.due_at = combineDateTimeToISO(action.patch.dueDate, null, true)
                        updateData.due_date = action.patch.dueDate
                    } else {
                        // Use chrono-node for deterministic natural language parsing
                        const extracted = extractDueDate(action.patch.dueDate)
                        if (extracted.dueDateISO) {
                            try {
                                const date = new Date(extracted.dueDateISO)
                                if (!isNaN(date.getTime())) {
                                    updateData.due_at = date.toISOString()
                                    updateData.due_date = extractDateFromDueAt(updateData.due_at)
                                }
                            } catch (e) {
                                console.error('Failed to parse extracted date:', extracted.dueDateISO, e)
                            }
                        }
                    }
                }
            }
            
            // Handle recurrence fields
            if (action.patch.recurrenceRule !== undefined) {
                updateData.recurrence_rule = action.patch.recurrenceRule
                if (action.patch.recurrenceTimezone !== undefined) {
                    updateData.recurrence_timezone = action.patch.recurrenceTimezone || 'UTC'
                } else if (action.patch.recurrenceRule !== null) {
                    // If setting recurrence but no timezone provided, default to UTC
                    updateData.recurrence_timezone = 'UTC'
                }
            } else if (action.patch.recurrenceTimezone !== undefined) {
                updateData.recurrence_timezone = action.patch.recurrenceTimezone
            }
            
            // Update all matched tasks and verify
            const { data: updatedTasks, error: updateError } = await supabase
                .from('tasks')
                .update(updateData)
                .in('id', tasks.map(t => t.id))
                .select('id, title, due_at')
            
            if (updateError) {
                results.push({
                    type: 'update',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: updateError.message
                })
                return {
                    success: false,
                    message: `Failed to update task: ${updateError.message}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            if (!updatedTasks || updatedTasks.length === 0) {
                results.push({
                    type: 'update',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: 'No tasks were updated'
                })
                return {
                    success: false,
                    message: 'No tasks were updated',
                    affectedCount: totalAffected,
                    results
                }
            }
            
            totalAffected += updatedTasks.length
            messages.push(`Updated ${updatedTasks.length} task(s)`)
            for (const task of updatedTasks) {
                results.push({
                    type: 'update',
                    ok: true,
                    id: task.id,
                    title: task.title,
                    due_at: task.due_at
                })
            }
        }
        
        if (action.type === 'delete') {
            // Find matching tasks with smart matching
            let tasks: any[] = []
            
            if (action.match.id) {
                // Direct ID match - use user_id OR guest_id
                let query = supabase
                    .from('tasks')
                    .select('id, title')
                    .eq('id', action.match.id)
                    .limit(1)
                
                if (isGuest && guestId) {
                    query = query.eq('guest_id', guestId)
                } else if (!isGuest && userId) {
                    query = query.eq('user_id', userId)
                } else {
                    results.push({
                        type: 'delete',
                        ok: false,
                        title: action.match.id,
                        error: 'No identity for delete'
                    })
                    return {
                        success: false,
                        message: 'No identity for delete',
                        affectedCount: totalAffected,
                        results
                    }
                }
                
                const { data, error: fetchError } = await query
                
                if (fetchError) {
                    results.push({
                        type: 'delete',
                        ok: false,
                        title: action.match.id,
                        error: fetchError.message
                    })
                    return {
                        success: false,
                        message: `Failed to find tasks: ${fetchError.message}`,
                        affectedCount: totalAffected,
                        results
                    }
                }
                
                tasks = data || []
            } else if (action.match.title) {
                // Smart title matching: exact -> case-insensitive exact -> contains (only if single result)
                const title = action.match.title.trim()
                
                // 1. Try exact match (case-sensitive) - use user_id OR guest_id
                let query = supabase
                    .from('tasks')
                    .select('id, title')
                    .eq('title', title)
                    .limit(action.limit || 100)
                
                if (isGuest && guestId) {
                    query = query.eq('guest_id', guestId)
                } else if (!isGuest && userId) {
                    query = query.eq('user_id', userId)
                } else {
                    results.push({
                        type: 'delete',
                        ok: false,
                        title: action.match.title,
                        error: 'No identity for delete'
                    })
                    return {
                        success: false,
                        message: 'No identity for delete',
                        affectedCount: totalAffected,
                        results
                    }
                }
                
                let { data, error: fetchError } = await query
                
                if (fetchError) {
                    results.push({
                        type: 'delete',
                        ok: false,
                        title: action.match.title,
                        error: fetchError.message
                    })
                    return {
                        success: false,
                        message: `Failed to find tasks: ${fetchError.message}`,
                        affectedCount: totalAffected,
                        results
                    }
                }
                
                if (data && data.length > 0) {
                    tasks = data
                } else {
                    // 2. Try case-insensitive exact match - use user_id OR guest_id
                    let query2 = supabase
                        .from('tasks')
                        .select('id, title')
                        .ilike('title', title)
                        .limit(action.limit || 100)
                    
                    if (isGuest && guestId) {
                        query2 = query2.eq('guest_id', guestId)
                    } else if (userId) {
                        query2 = query2.eq('user_id', userId)
                    } else {
                        results.push({
                            type: 'delete',
                            ok: false,
                            title: action.match.title,
                            error: 'No identity for delete'
                        })
                        return {
                            success: false,
                            message: 'No identity for delete',
                            affectedCount: totalAffected,
                            results
                        }
                    }
                    
                    const { data: data2, error: fetchError2 } = await query2
                    
                    if (fetchError2) {
                        results.push({
                            type: 'delete',
                            ok: false,
                            title: action.match.title,
                            error: fetchError2.message
                        })
                        return {
                            success: false,
                            message: `Failed to find tasks: ${fetchError2.message}`,
                            affectedCount: totalAffected,
                            results
                        }
                    }
                    
                    if (data2 && data2.length > 0) {
                        tasks = data2
                    } else {
                        // 3. Try contains match (only if single result expected) - use user_id OR guest_id
                        let query3 = supabase
                            .from('tasks')
                            .select('id, title')
                            .ilike('title', `%${title}%`)
                            .limit(action.limit || 100)
                        
                        if (isGuest && guestId) {
                            query3 = query3.eq('guest_id', guestId)
                        } else if (userId) {
                            query3 = query3.eq('user_id', userId)
                        } else {
                            results.push({
                                type: 'delete',
                                ok: false,
                                title: action.match.title,
                                error: 'No identity for delete'
                            })
                            return {
                                success: false,
                                message: 'No identity for delete',
                                affectedCount: totalAffected,
                                results
                            }
                        }
                        
                        const { data: data3, error: fetchError3 } = await query3
                        
                        if (fetchError3) {
                            results.push({
                                type: 'delete',
                                ok: false,
                                title: action.match.title,
                                error: fetchError3.message
                            })
                            return {
                                success: false,
                                message: `Failed to find tasks: ${fetchError3.message}`,
                                affectedCount: totalAffected,
                                results
                            }
                        }
                        
                        tasks = data3 || []
                    }
                }
            } else {
                results.push({
                    type: 'delete',
                    ok: false,
                    error: 'Delete action requires id or title to match'
                })
                return {
                    success: false,
                    message: 'Delete action requires id or title to match',
                    affectedCount: totalAffected,
                    results
                }
            }
            
            // Check for multiple matches (requires confirmation)
            if (tasks.length > 1 && !action.match.id) {
                results.push({
                    type: 'delete',
                    ok: false,
                    title: action.match.title,
                    error: 'Multiple tasks match'
                })
                return {
                    success: false,
                    message: `Multiple tasks match "${action.match.title}". Please be more specific or use the task ID.`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            if (tasks.length === 0) {
                results.push({
                    type: 'delete',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: 'No task found matching'
                })
                return {
                    success: false,
                    message: `No task found matching: ${action.match.title || action.match.id}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            // Delete all matched tasks and verify
            const { data: deletedTasks, error: deleteError } = await supabase
                .from('tasks')
                .delete()
                .in('id', tasks.map(t => t.id))
                .select('id, title')
            
            if (deleteError) {
                results.push({
                    type: 'delete',
                    ok: false,
                    title: action.match.title || action.match.id,
                    error: deleteError.message
                })
                return {
                    success: false,
                    message: `Failed to delete task: ${deleteError.message}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            totalAffected += (deletedTasks?.length || 0)
            messages.push(`Deleted ${deletedTasks?.length || 0} task(s)`)
            for (const task of (deletedTasks || [])) {
                results.push({
                    type: 'delete',
                    ok: true,
                    id: task.id,
                    title: task.title
                })
            }
        }
        
        if (action.type === 'bulk_delete_all') {
            // Delete all tasks - use user_id OR guest_id
            let query = supabase
                .from('tasks')
                .delete()
                .select('id')
            
            if (isGuest && guestId) {
                query = query.eq('guest_id', guestId)
            } else if (userId) {
                query = query.eq('user_id', userId)
            } else {
                results.push({
                    type: 'bulk_delete_all',
                    ok: false,
                    error: 'No identity for bulk delete'
                })
                return {
                    success: false,
                    message: 'No identity for bulk delete',
                    affectedCount: totalAffected,
                    results
                }
            }
            
            const { data: deletedTasks, error: deleteError } = await query
            
            if (deleteError) {
                results.push({
                    type: 'bulk_delete_all',
                    ok: false,
                    error: deleteError.message
                })
                return {
                    success: false,
                    message: `Failed to delete all tasks: ${deleteError.message}`,
                    affectedCount: totalAffected,
                    results
                }
            }
            
            // Count deleted
            const deletedCount = deletedTasks?.length || 0
            totalAffected += deletedCount
            messages.push(`Deleted all tasks (${deletedCount})`)
            results.push({
                type: 'bulk_delete_all',
                ok: true
            })
        }
    }
    
    return {
        success: true,
        message: messages.join('. ') || 'No actions executed',
        affectedCount: totalAffected,
        results
    }
}

