import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionAccess } from '@/lib/subscription'

export const FREE_PLAN_LIMIT = 5

export type UsageStats = {
    tasksCount: number
    limit: number
    isPro: boolean
    isSampleSeeded: boolean
    hasSeenOnboarding: boolean
}

export async function getUsageStats(userId: string): Promise<UsageStats> {
    const supabase = await createClient()
    const isPro = await checkSubscriptionAccess(userId)
    const limit = isPro ? Infinity : FREE_PLAN_LIMIT

    // Get task count (excluding samples)
    const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_sample', false)

    // Get user settings
    const { data: settings } = await supabase
        .from('user_settings')
        .select('sample_seeded, onboarding_completed')
        .eq('user_id', userId)
        .single()

    return {
        tasksCount: count || 0,
        limit,
        isPro,
        isSampleSeeded: settings?.sample_seeded ?? false,
        hasSeenOnboarding: settings?.onboarding_completed ?? false
    }
}

export async function seedSampleTasks(userId: string) {
    const supabase = await createClient()

    // Clean checking to ensure idempotency
    const { data: settings } = await supabase
        .from('user_settings')
        .select('sample_seeded')
        .eq('user_id', userId)
        .single()

    if (settings?.sample_seeded) return

    // Create settings if doesn't exist (handling race condition/first login)
    if (!settings) {
        await supabase.from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id' })
    }

    const samples = [
        {
            user_id: userId,
            title: '👋 Welcome! This is a sample task',
            description: 'You can edit or delete this task. Try dragging it to "Completed"!',
            status: 'pending',
            is_sample: true
        },
        {
            user_id: userId,
            title: '🚀 Upgrade to Pro',
            description: 'Unlock unlimited tasks and support the project.',
            status: 'pending',
            is_sample: true
        }
    ]

    await supabase.from('tasks').insert(samples as any)

    await supabase
        .from('user_settings')
        .update({ sample_seeded: true })
        .eq('user_id', userId)
}

export async function canCreateTask(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const stats = await getUsageStats(userId)

    if (stats.tasksCount >= stats.limit) {
        return { allowed: false, reason: `Free plan limit reached (${stats.limit} tasks). Upgrade to create more.` }
    }

    return { allowed: true }
}
