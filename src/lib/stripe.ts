import Stripe from 'stripe'

export const stripe = () => {
    const key = process.env.STRIPE_SECRET_KEY

    if (!key) {
        throw new Error('Missing STRIPE_SECRET_KEY')
    }

    return new Stripe(key, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
    })
}
