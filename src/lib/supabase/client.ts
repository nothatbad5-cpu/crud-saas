import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database.types'

export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
        throw new Error(
            'Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY\n' +
            'Please check your .env.local file and ensure all required variables are set.'
        )
    }

    return createBrowserClient<Database>(url, key, {
        auth: {
            persistSession: true, // Explicitly enable session persistence
            autoRefreshToken: true, // Automatically refresh tokens
            detectSessionInUrl: true, // Detect session in URL (for OAuth flows)
        },
    })
}
