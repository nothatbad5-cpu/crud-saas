'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canCreateTask } from '@/lib/usage'

/**
 * Create a task with a specific due date
 */
export async function createTaskWithDate(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check usage limits
    const { allowed, reason } = await canCreateTask(user.id)
    if (!allowed) {
        return { error: reason }
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const due_date = formData.get('due_date') as string
    const status = (formData.get('status') as 'pending' | 'completed') || 'pending'

    const { error } = await supabase.from('tasks').insert({
        title,
        description,
        status,
        due_date,
        user_id: user.id,
    })

    if (error) {
        return { error: 'Could not create task' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Update a task's due date
 */
export async function updateTaskDate(taskId: string, newDate: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('tasks')
        .update({ due_date: newDate })
        .eq('id', taskId)
        .eq('user_id', user.id)

    if (error) {
        return { error: 'Could not update task' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}

/**
 * Quick toggle task status
 */
export async function toggleTaskStatus(taskId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get current status
    const { data: task } = await supabase
        .from('tasks')
        .select('status')
        .eq('id', taskId)
        .eq('user_id', user.id)
        .single()

    if (!task) {
        return { error: 'Task not found' }
    }

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)
        .eq('user_id', user.id)

    if (error) {
        return { error: 'Could not update task' }
    }

    revalidatePath('/dashboard')
    return { success: true }
}
