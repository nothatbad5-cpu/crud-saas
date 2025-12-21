import { createClient } from '@/lib/supabase/server'

export async function getSubscriptionStatus(userId: string) {
    const supabase = await createClient()
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('status, current_period_end')
        .eq('user_id', userId)
        .single()

    if (!subscription) return null

    // Check if active or trialing
    const isValid =
        subscription.status === 'active' ||
        subscription.status === 'trialing'

    return {
        ...subscription,
        isValid,
    }
}

export async function checkSubscriptionAccess(userId: string) {
    const status = await getSubscriptionStatus(userId);
    return status?.isValid ?? false;
}
