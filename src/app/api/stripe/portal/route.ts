import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get customer ID from subscriptions table
    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single()

    if (!subscription?.stripe_customer_id) {
        return new NextResponse('No active subscription found', { status: 400 })
    }

    const stripeClient = stripe()
    const session = await stripeClient.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/billing`,
    })

    return NextResponse.json({ url: session.url })
}
