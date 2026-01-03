'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionAccess } from '@/lib/subscription'
import { canCreateTask } from '@/lib/usage'

// New Action: Complete Onboarding
export async function completeOnboarding() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) return

        const { error } = await supabase
            .from('user_settings')
            .update({ onboarding_completed: true })
            .eq('user_id', user.id)

        if (error) {
            console.error('Failed to complete onboarding:', error)
            // Non-critical, continue silently
        }

        revalidatePath('/dashboard')
    } catch (error) {
        console.error('Error in completeOnboarding:', error)
        // Non-critical, continue silently
    }
}

export async function createTask(formData: FormData) {
    try {
        const supabase = await createClient()

        // CRITICAL: Verify auth before proceeding
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // STRICT AUTH: Must have authenticated user
        if (authError || !user) {
            redirect('/login')
            return
        }

        // Phase 3: Check usage limits (Pro users bypass this in canCreateTask logic)
        const { allowed, reason } = await canCreateTask(user.id)

        // NOTE: We allow Pro users to create tasks even if they don't have subscription active 
        // IF we wanted strictly Gated access only, we'd keep the checkSubscriptionAccess 
        // but the prompt says Free users have 5 tasks.
        // So:
        // 1. If Pro -> Unlimited
        // 2. If Free -> Limited to 5

        if (!allowed) {
            // If not allowed, it means limit reached.
            // Return error to be displayed on the form page instead of redirecting
            // This prevents the error query param loop
            throw new Error(reason ?? 'Task limit reached. Please upgrade to Pro for unlimited tasks.')
        }

        // Get due_date and optional time from form
        const dueDateInput = formData.get('dueDate') as string || formData.get('due_date') as string
        const dueTimeInput = formData.get('dueTime') as string || null
        const allDay = formData.get('allDay') === 'true' || formData.get('allDay') === 'on'
        const due_date_input = dueDateInput || new Date().toISOString().split('T')[0]
        
        // Convert to due_at timestamptz
        const { combineDateTimeToISO, extractDateFromDueAt } = await import('@/lib/datetime-utils')
        const due_at = combineDateTimeToISO(due_date_input, dueTimeInput, allDay)
        // Always set due_date = due_at::date for backwards compatibility
        const due_date = due_at ? extractDateFromDueAt(due_at) : due_date_input

        const title = formData.get('title') as string
        if (!title || !title.trim()) {
            throw new Error('Task title is required')
        }

        const { error } = await supabase.from('tasks').insert({
            title: title.trim(),
            description: (formData.get('description') as string) || null,
            status: (formData.get('status') as 'pending' | 'completed') || 'pending',
            due_date, // Always set from due_at for compatibility
            due_at,   // Primary field
            user_id: user.id, // ALWAYS set user_id, never guest_id
        })

        if (error) {
            // Return structured error instead of redirecting
            // This allows the form page to display the error inline
            throw new Error(error.message || 'Could not create task. Please try again.')
        }

        // CRITICAL: Revalidate before redirect to ensure new task appears
        revalidatePath('/dashboard')
        
        // Always redirect to dashboard on success
        redirect('/dashboard')
    } catch (error: any) {
        // Check if it's a redirect error (from redirect() call)
        if (error?.digest?.startsWith('NEXT_REDIRECT')) {
            throw error // Re-throw redirect errors
        }
        
        console.error('Error in createTask:', error)
        
        // Return error to be displayed on the form page
        // This prevents the error query param loop pattern
        // The form page will catch this and display it inline
        throw new Error(error?.message || 'An unexpected error occurred. Please try again.')
    }
}

export async function updateTask(id: string, formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        const title = formData.get('title') as string
        const description = formData.get('description') as string
        const status = formData.get('status') as 'pending' | 'completed'
        const start_time = (formData.get('start_time') as string) || null
        const end_time = (formData.get('end_time') as string) || null
        const due_date = (formData.get('dueDate') as string) || (formData.get('due_date') as string) || null
        const dueTime = (formData.get('dueTime') as string) || null
        const allDay = formData.get('allDay') === 'true' || formData.get('allDay') === 'on'

        // Validate time range (legacy)
        if (start_time && end_time && end_time < start_time) {
            redirect(`/dashboard/${id}/edit?error=${encodeURIComponent('End time must be after start time')}`)
            return
        }

        // Convert date + time to due_at
        const { combineDateTimeToISO, extractDateFromDueAt } = await import('@/lib/datetime-utils')
        const due_at = due_date ? combineDateTimeToISO(due_date, dueTime || start_time, allDay) : null
        // Always set due_date = due_at::date for backwards compatibility
        const due_date_final = due_at ? extractDateFromDueAt(due_at) : due_date

        const updateData: {
            title: string
            description: string
            status: 'pending' | 'completed'
            start_time: string | null
            end_time: string | null
            due_date?: string | null
            due_at?: string | null
        } = {
            title,
            description,
            status,
            start_time,
            end_time,
        }

        // Update due_date and due_at if provided (always keep them in sync)
        if (due_date_final) {
            updateData.due_date = due_date_final
        }
        if (due_at) {
            updateData.due_at = due_at
        }

        const { error } = await supabase
            .from('tasks')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            redirect(`/dashboard/${id}/edit?error=${encodeURIComponent(error.message || 'Could not update task')}`)
        }

        revalidatePath('/dashboard')
        redirect('/dashboard')
    } catch (error) {
        console.error('Error in updateTask:', error)
        redirect(`/dashboard/${id}/edit?error=${encodeURIComponent('An unexpected error occurred. Please try again.')}`)
    }
}

export async function deleteTask(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            throw new Error('Unauthorized')
        }

        // Relaxed gating for Phase 3

        const { error } = await supabase.from('tasks').delete().eq('id', id).eq('user_id', user.id)

        if (error) {
            console.error('Failed to delete task:', error)
            throw new Error(error.message || 'Failed to delete task')
        }

        revalidatePath('/dashboard')
    } catch (error) {
        console.error('Error in deleteTask:', error)
        throw error // Re-throw to be handled by calling component
    }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
