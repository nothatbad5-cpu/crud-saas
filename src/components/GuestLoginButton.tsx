'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function GuestLoginButton() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleGuestLogin = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.signInAnonymously()
            
            if (error) {
                console.error('Guest login error:', error)
                router.push('/login?error=' + encodeURIComponent('Failed to sign in as guest. Please try again.'))
                return
            }
            
            router.push('/dashboard')
            router.refresh()
        } catch (error) {
            console.error('Guest login error:', error)
            router.push('/login?error=' + encodeURIComponent('An unexpected error occurred.'))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Signing in...' : 'Continue as Guest'}
        </button>
    )
}

