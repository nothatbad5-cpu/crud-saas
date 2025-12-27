/**
 * Validates required environment variables at runtime
 * Throws descriptive errors if any are missing
 */

export function validateEnvVars() {
    const requiredVars = {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }

    const missing: string[] = []

    for (const [key, value] of Object.entries(requiredVars)) {
        if (!value) {
            missing.push(key)
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            'Please check your .env.local file and ensure all required variables are set.'
        )
    }
}

/**
 * Validates optional environment variables and returns warnings
 * Does not throw, but logs warnings for missing optional vars
 */
export function validateOptionalEnvVars() {
    const optionalVars = {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
        STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    }

    const missing: string[] = []

    for (const [key, value] of Object.entries(optionalVars)) {
        if (!value) {
            missing.push(key)
        }
    }

    if (missing.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn(
            `⚠️  Missing optional environment variables: ${missing.join(', ')}\n` +
            'Some features may not work correctly without these variables.'
        )
    }
}

