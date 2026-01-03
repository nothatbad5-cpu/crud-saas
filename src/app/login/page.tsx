'use client'

import { login } from '@/app/auth/actions'
import { useActionState, useEffect, useRef, Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginForm() {
    const searchParams = useSearchParams()
    const formRef = useRef<HTMLFormElement>(null)
    const emailInputRef = useRef<HTMLInputElement>(null)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [resendMessage, setResendMessage] = useState<string | null>(null)
    
    // Prefill email from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && emailInputRef.current) {
            const rememberedEmail = localStorage.getItem('remember_email')
            if (rememberedEmail) {
                emailInputRef.current.value = rememberedEmail
            }
        }
    }, [])

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendCooldown])

    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            await login(formData)
            // If we reach here without redirect, something went wrong
            return { error: null, needsVerification: false, email: null }
        } catch (error: any) {
            // Check if it's a redirect error (from redirect() call)
            if (error?.digest?.startsWith('NEXT_REDIRECT')) {
                // Redirect is happening, let it proceed
                throw error
            }
            // Return error to be displayed
            return { error: error?.message || 'An unexpected error occurred. Please try again.', needsVerification: false, email: null }
        }
    }, { error: null, needsVerification: false, email: null })

    // Get error from URL params (for redirects from server action)
    const urlError = searchParams.get('error')
    const needsVerification = urlError?.includes('verify') || urlError?.includes('Email not confirmed') || urlError?.includes('not confirmed')
    const emailFromError = urlError?.includes('@') ? urlError.split(' ').find(word => word.includes('@')) : null

    const handleResendConfirmation = async () => {
        if (resendCooldown > 0) return
        
        const email = emailInputRef.current?.value || emailFromError
        if (!email) {
            setResendMessage('Please enter your email address first.')
            return
        }

        try {
            const supabase = createClient()
            const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${origin}/auth/callback?next=/dashboard`
                }
            })

            if (error) {
                setResendMessage(error.message || 'Failed to resend confirmation email.')
            } else {
                setResendMessage('Confirmation email sent! Check your inbox.')
                setResendCooldown(60) // 60 second cooldown
            }
        } catch (error: any) {
            setResendMessage(error?.message || 'Failed to resend confirmation email.')
        }
    }

    const handleSubmit = async (formData: FormData) => {
        // Handle "Remember me" checkbox
        const rememberMe = formData.get('remember_me') === 'on'
        const email = formData.get('email') as string

        if (rememberMe && email) {
            localStorage.setItem('remember_me', 'true')
            localStorage.setItem('remember_email', email)
        } else {
            localStorage.removeItem('remember_me')
            localStorage.removeItem('remember_email')
        }

        // Call the server action
        return formAction(formData)
    }

    return (
        <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
            <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                <div className="text-center">
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-100">Sign in to your account</h2>
                </div>
                <form ref={formRef} action={handleSubmit} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                ref={emailInputRef}
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                disabled={isPending}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] placeholder-[#737373] text-[#f5f5f5] rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                disabled={isPending}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] placeholder-[#737373] text-[#f5f5f5] rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {/* Remember me checkbox */}
                    <div className="flex items-center">
                        <input
                            id="remember_me"
                            name="remember_me"
                            type="checkbox"
                            defaultChecked={typeof window !== 'undefined' ? localStorage.getItem('remember_me') === 'true' : false}
                            className="h-4 w-4 text-[#f5f5f5] border-[#262626] bg-[#0f0f0f] rounded focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                        />
                        <label htmlFor="remember_me" className="ml-2 block text-sm text-gray-300">
                            Remember me
                        </label>
                    </div>

                    {(urlError || state.error) && (
                        <div className="text-red-400 text-sm text-center bg-[#1f1f1f] p-3 border border-red-500/30 rounded">
                            {urlError || state.error}
                        </div>
                    )}

                    {/* Email verification message with resend button */}
                    {needsVerification && (
                        <div className="bg-[#1f1f1f] p-4 border border-[#262626] rounded">
                            <p className="text-[#f5f5f5] text-sm mb-3">
                                Please verify your email. Check inbox/spam.
                            </p>
                            <button
                                type="button"
                                onClick={handleResendConfirmation}
                                disabled={resendCooldown > 0}
                                className="w-full text-sm text-[#f5f5f5] bg-[#262626] hover:bg-[#333] px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {resendCooldown > 0 
                                    ? `Resend in ${resendCooldown}s` 
                                    : 'Resend confirmation email'}
                            </button>
                            {resendMessage && (
                                <p className={`text-sm mt-2 ${resendMessage.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                                    {resendMessage}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <a href="/signup" className="font-medium text-[#f5f5f5] hover:opacity-80">
                            Don&apos;t have an account? Sign up
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
                <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                    <div className="text-center">
                        <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-100">Sign in to your account</h2>
                    </div>
                    <div className="text-center text-gray-400">Loading...</div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
