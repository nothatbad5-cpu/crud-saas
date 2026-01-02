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
            const { data, error } = await supabase.auth.signInAnonymously()
            
            if (error || !data.user) {
                console.error('Guest login error:', error)
                router.push('/login?error=' + encodeURIComponent('Failed to sign in as guest. Please try again.'))
                return
            }
            
            // Set guest_id cookie - call server action to set cookie
            const guestId = data.user.id
            await fetch('/api/auth/set-guest-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId }),
            })
            
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
            className="w-full flex justify-center py-2 px-4 border border-[#262626] rounded-md shadow-sm text-sm font-medium text-[#f5f5f5] bg-[#161616] hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Signing in...' : 'Continue as Guest'}
        </button>
    )
}

