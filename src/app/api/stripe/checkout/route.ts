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

    if (!process.env.STRIPE_PRICE_ID) {
        return new NextResponse('Missing STRIPE_PRICE_ID', { status: 500 })
    }

    const stripeClient = stripe()

    const session = await stripeClient.checkout.sessions.create({
        line_items: [
            {
                price: process.env.STRIPE_PRICE_ID,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?canceled=true`,
        customer_email: user.email,
        metadata: {
            user_id: user.id,
        },
    })

    return NextResponse.json({ url: session.url })
}
