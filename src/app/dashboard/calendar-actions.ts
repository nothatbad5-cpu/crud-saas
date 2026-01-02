'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canCreateTask } from '@/lib/usage'
import { combineDateTimeToISO, extractDateFromDueAt } from '@/lib/datetime-utils'
import { cookies } from 'next/headers'

/**
 * Create a task with a specific due date and optional time
 */
export async function createTaskWithDate(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // Get guest_id from cookie if no authenticated user
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        // Must have user OR guest_id
        if ((authError || !user) && !guestId) {
            redirect('/login')
        }
        
        const isGuest = !user && !!guestId

        // Check usage limits (only for authenticated users)
        if (!isGuest && user) {
            const { allowed, reason } = await canCreateTask(user.id)
            if (!allowed) {
                return { error: reason }
            }
        }

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const dueDate = formData.get('dueDate') as string || formData.get('due_date') as string // Support both for backwards compat
        const dueTime = formData.get('dueTime') as string || null
        const allDay = formData.get('allDay') === 'true' || formData.get('allDay') === 'on'
        const status = (formData.get('status') as 'pending' | 'completed') || 'pending'
        
        // Legacy support: start_time/end_time (for backwards compatibility)
        const start_time = (formData.get('start_time') as string) || null
        const end_time = (formData.get('end_time') as string) || null

        if (!title || !title.trim()) {
            return { error: 'Task title is required' }
        }

        if (!dueDate) {
            return { error: 'Due date is required' }
        }

        // Validate time format if provided
        if (dueTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(dueTime)) {
            return { error: 'Invalid time format. Use HH:mm (e.g., 09:30)' }
        }

        // Validate legacy time range
        if (start_time && end_time && end_time < start_time) {
            return { error: 'End time must be after start time' }
        }

        // Convert date + time to due_at timestamptz
        const due_at = combineDateTimeToISO(dueDate, dueTime || start_time, allDay)
        
        // Always set due_date = due_at::date for backwards compatibility
        const due_date = due_at ? extractDateFromDueAt(due_at) : dueDate

        const insertData: any = {
            title: title.trim(),
            description: description || null,
            status,
            due_date, // Always set from due_at for compatibility
            due_at,   // Primary field
            start_time: start_time || null, // Keep for backwards compatibility
            end_time: end_time || null,     // Keep for backwards compatibility
        }
        
        // Set user_id OR guest_id (never both)
        if (isGuest && guestId) {
            insertData.guest_id = guestId
            insertData.user_id = null
        } else if (user) {
            insertData.user_id = user.id
            insertData.guest_id = null
        } else {
            return { error: 'No identity found' }
        }
        
        const { error } = await supabase.from('tasks').insert(insertData)

        if (error) {
            console.error('Error creating task:', error)
            return { error: error.message || 'Could not create task' }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error in createTaskWithDate:', error)
        return { error: 'An unexpected error occurred. Please try again.' }
    }
}

/**
 * Update a task's due date (and optionally time)
 */
export async function updateTaskDate(taskId: string, newDate: string, newTime?: string | null, allDay?: boolean) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        if (!newDate) {
            return { error: 'Date is required' }
        }

        // Convert to due_at
        const due_at = combineDateTimeToISO(newDate, newTime || null, allDay || false)
        // Always set due_date = due_at::date for backwards compatibility
        const due_date = due_at ? extractDateFromDueAt(due_at) : newDate

        const { error } = await supabase
            .from('tasks')
            .update({ 
                due_date, // Always set from due_at for compatibility
                due_at    // Primary field
            })
            .eq('id', taskId)
            .eq('user_id', user.id)

        if (error) {
            console.error('Error updating task date:', error)
            return { error: error.message || 'Could not update task' }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error in updateTaskDate:', error)
        return { error: 'An unexpected error occurred. Please try again.' }
    }
}

/**
 * Quick toggle task status
 * If task has recurrence and is being marked completed, creates next occurrence
 */
export async function toggleTaskStatus(taskId: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        // Validate taskId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!uuidRegex.test(taskId)) {
            console.error('Invalid task ID format:', taskId)
            return { error: 'Invalid task ID' }
        }

        // Get current task with all fields including recurrence
        // Use real DB UUID - ensure taskId is the actual primary key
        const { data: task, error: selectError } = await supabase
            .from('tasks')
            .select('id, status, recurrence_rule, recurrence_timezone, due_at, title, description, user_id')
            .eq('id', taskId)
            .eq('user_id', user.id)
            .single()

        if (selectError) {
            console.error('Error fetching task:', selectError)
            return { error: selectError.message || 'Task not found' }
        }

        if (!task) {
            console.error('Task not found for ID:', taskId, 'User:', user.id)
            return { error: 'Task not found' }
        }

        // Double-check the task belongs to the user
        if (task.user_id !== user.id) {
            console.error('Task ownership mismatch:', task.user_id, 'vs', user.id)
            return { error: 'Unauthorized' }
        }

        const newStatus = task.status === 'completed' ? 'pending' : 'completed'

        // If marking as completed and task has recurrence, create next occurrence
        if (newStatus === 'completed' && task.recurrence_rule && task.due_at) {
            const { getNextOccurrenceFromRule } = await import('@/lib/recurrence')
            const { extractDateFromDueAt, combineDateTimeToISO } = await import('@/lib/datetime-utils')
            
            const fromDate = new Date(task.due_at)
            const nextDueAt = getNextOccurrenceFromRule(task.recurrence_rule, fromDate)
            
            if (nextDueAt) {
                // Create next occurrence task
                const nextDueDate = extractDateFromDueAt(nextDueAt)
                
                const { error: createError } = await supabase.from('tasks').insert({
                    title: task.title,
                    description: task.description,
                    status: 'pending',
                    due_at: nextDueAt,
                    due_date: nextDueDate,
                    recurrence_rule: task.recurrence_rule,
                    recurrence_timezone: task.recurrence_timezone || 'UTC',
                    user_id: user.id,
                })

                if (createError) {
                    console.error('Error creating next recurrence:', createError)
                    // Continue with status update even if recurrence creation fails
                }
            }
        }

        // Update current task status
        const { error: updateError } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId)
            .eq('user_id', user.id)

        if (updateError) {
            console.error('Error toggling task status:', updateError)
            return { error: updateError.message || 'Could not update task' }
        }

        revalidatePath('/dashboard')
        return { success: true }
    } catch (error) {
        console.error('Error in toggleTaskStatus:', error)
        return { error: 'An unexpected error occurred. Please try again.' }
    }
}
