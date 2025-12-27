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
    try {
        const supabase = await createClient()
        const isPro = await checkSubscriptionAccess(userId)
        const limit = isPro ? Infinity : FREE_PLAN_LIMIT

        // Get task count (excluding samples)
        const { count, error: countError } = await supabase
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_sample', false)

        if (countError) {
            console.error('Error getting task count:', countError)
        }

        // Get user settings
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('sample_seeded, onboarding_completed')
            .eq('user_id', userId)
            .single()

        if (settingsError && settingsError.code !== 'PGRST116') {
            // PGRST116 is "not found" which is expected for new users
            console.error('Error getting user settings:', settingsError)
        }

        return {
            tasksCount: count || 0,
            limit,
            isPro,
            isSampleSeeded: settings?.sample_seeded ?? false,
            hasSeenOnboarding: settings?.onboarding_completed ?? false
        }
    } catch (error) {
        console.error('Error in getUsageStats:', error)
        // Return safe defaults on error
        return {
            tasksCount: 0,
            limit: FREE_PLAN_LIMIT,
            isPro: false,
            isSampleSeeded: false,
            hasSeenOnboarding: false
        }
    }
}

export async function seedSampleTasks(userId: string) {
    try {
        const supabase = await createClient()

        // Clean checking to ensure idempotency
        const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('sample_seeded')
            .eq('user_id', userId)
            .single()

        if (settingsError && settingsError.code !== 'PGRST116') {
            // PGRST116 is "not found" which is expected for new users
            console.error('Error checking user settings:', settingsError)
            return
        }

        if (settings?.sample_seeded) return

        // Create settings if doesn't exist (handling race condition/first login)
        if (!settings) {
            const { error: upsertError } = await supabase.from('user_settings').upsert({ user_id: userId }, { onConflict: 'user_id' })
            if (upsertError) {
                console.error('Error creating user settings:', upsertError)
                return
            }
        }

        const today = new Date().toISOString().split('T')[0]
        // Create due_at for sample tasks (all-day tasks at start of day)
        const todayStartOfDay = new Date(today + 'T00:00:00').toISOString()
        
        const samples = [
            {
                user_id: userId,
                title: '👋 Welcome! This is a sample task',
                description: 'You can edit or delete this task. Try dragging it to "Completed"!',
                status: 'pending' as const,
                is_sample: true,
                due_date: today, // Backwards compatibility
                due_at: todayStartOfDay // Primary field
            },
            {
                user_id: userId,
                title: '🚀 Upgrade to Pro',
                description: 'Unlock unlimited tasks and support the project.',
                status: 'pending' as const,
                is_sample: true,
                due_date: today, // Backwards compatibility
                due_at: todayStartOfDay // Primary field
            }
        ]

        const { error: insertError } = await supabase.from('tasks').insert(samples)
        if (insertError) {
            console.error('Error inserting sample tasks:', insertError)
            return
        }

        const { error: updateError } = await supabase
            .from('user_settings')
            .update({ sample_seeded: true })
            .eq('user_id', userId)

        if (updateError) {
            console.error('Error updating sample_seeded flag:', updateError)
        }
    } catch (error) {
        console.error('Error in seedSampleTasks:', error)
        // Non-critical, continue silently
    }
}

export async function canCreateTask(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const stats = await getUsageStats(userId)

    if (stats.tasksCount >= stats.limit) {
        return { allowed: false, reason: `Free plan limit reached (${stats.limit} tasks). Upgrade to create more.` }
    }

    return { allowed: true }
}
