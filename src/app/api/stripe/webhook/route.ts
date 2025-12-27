import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

async function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing required Supabase environment variables for webhook')
    }

    // Use service role key to bypass RLS for webhook operations
    return createServerClient<Database>(
        supabaseUrl,
        serviceRoleKey, // Service role key bypasses RLS
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll() { }
            }
        }
    )
}

export async function POST(req: Request) {
    const body = await req.text()
    const signature = (await headers()).get('Stripe-Signature') as string
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!webhookSecret) {
        return new NextResponse('Missing STRIPE_WEBHOOK_SECRET', { status: 500 })
    }

    let event: Stripe.Event
    const stripeClient = stripe()

    try {
        event = stripeClient.webhooks.constructEvent(
            body,
            signature,
            webhookSecret
        )
    } catch (error) {
        return new NextResponse('Webhook error', { status: 400 })
    }

    const session = event.data.object as Stripe.Checkout.Session
    const supabase = await getSupabase()

    try {
        if (event.type === 'checkout.session.completed') {
            if (!session.subscription) {
                console.error('No subscription found in session')
                return new NextResponse('No subscription found in session', { status: 400 })
            }

            if (!session.metadata?.user_id) {
                console.error('No user_id in session metadata')
                return new NextResponse('No user_id in session metadata', { status: 400 })
            }

            // Explicitly cast the response from retrieve to Stripe.Subscription to satisfy TypeScript
            const subDetails = await stripeClient.subscriptions.retrieve(session.subscription as string)

            const { error: upsertError } = await supabase.from('subscriptions').upsert({
                id: subDetails.id,
                user_id: session.metadata.user_id,
                stripe_customer_id: subDetails.customer as string,
                stripe_subscription_id: subDetails.id,
                status: subDetails.status,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_end: new Date((subDetails as any).current_period_end * 1000).toISOString(),
            })

            if (upsertError) {
                console.error('Error upserting subscription:', upsertError)
                return new NextResponse('Database error', { status: 500 })
            }
        }

        if (event.type === 'customer.subscription.updated') {
            const subscription = event.data.object as Stripe.Subscription
            // Upsert to ensure if checkout event is missed/delayed, we still capture state
            const { data: userData, error: selectError } = await supabase
                .from('subscriptions')
                .select('user_id')
                .eq('stripe_subscription_id', subscription.id)
                .single()

            if (selectError) {
                console.error('Error finding subscription:', selectError)
                return new NextResponse('Subscription not found', { status: 404 })
            }

            if (userData) {
                const { error: updateError } = await supabase.from('subscriptions').update({
                    status: subscription.status,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                }).eq('id', subscription.id)

                if (updateError) {
                    console.error('Error updating subscription:', updateError)
                    return new NextResponse('Database error', { status: 500 })
                }
            }
        }

        if (event.type === 'customer.subscription.deleted') {
            const subscription = event.data.object as Stripe.Subscription
            const { error: updateError } = await supabase.from('subscriptions').update({
                status: subscription.status, // canceled
            }).eq('id', subscription.id)

            if (updateError) {
                console.error('Error updating deleted subscription:', updateError)
                return new NextResponse('Database error', { status: 500 })
            }
        }
    } catch (error) {
        console.error('Error processing webhook event:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }

    return new NextResponse(null, { status: 200 })
}
