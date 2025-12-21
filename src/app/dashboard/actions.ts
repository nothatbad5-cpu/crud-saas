'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionAccess } from '@/lib/subscription'
import { canCreateTask } from '@/lib/usage'

// New Action: Complete Onboarding
export async function completeOnboarding() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    await supabase
        .from('user_settings')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id)

    revalidatePath('/dashboard')
}

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
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
        // But we also need to check if they are "Gated".
        // The previous logic was: "If not subscribed, redirect to pricing".
        // Phase 3 requirements say: Free users can create up to 5 tasks.
        // So we ONLY block if they are Free AND over limit.

        // If reason is limit reached, redirect with error
        redirect(`/dashboard?error=${encodeURIComponent(reason ?? 'Limit reached')}`)
        return
    }

    // CAUTION: The previous logic strictly gated ALL creation.
    // We must remove the strict "checkSubscriptionAccess" block here to allow Free users up to 5.
    // canCreateTask already handles "if pro -> infinity".

    const { error } = await supabase.from('tasks').insert({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        status: formData.get('status') as 'pending' | 'completed',
        user_id: user.id,
    })

    if (error) {
        redirect('/dashboard/new?error=Could not create task')
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function updateTask(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Update/Delete are typically allowed for free users on their own tasks.
    // Previous gating was strict. Now we should likely relax it or keep it?
    // Prompt says: "Free users can create up to 5 tasks". It implies they can use the app.
    // So we REMOVE the strict subscription check for Update/Delete too.

    // Authorization (RLS) handles ownership.

    const { error } = await supabase
        .from('tasks')
        .update({
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as 'pending' | 'completed',
        })
        .eq('id', id)

    if (error) {
        redirect(`/dashboard/${id}/edit?error=Could not update task`)
    }

    revalidatePath('/dashboard')
    redirect('/dashboard')
}

export async function deleteTask(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    // Relaxed gating for Phase 3

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
        throw new Error('Failed to delete task')
    }

    revalidatePath('/dashboard')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}
