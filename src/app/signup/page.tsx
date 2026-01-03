'use client'

import { signup } from '@/app/auth/actions'
import { useActionState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SignupForm() {
    const searchParams = useSearchParams()
    const formRef = useRef<HTMLFormElement>(null)
    const [state, formAction, isPending] = useActionState(async (prevState: any, formData: FormData) => {
        try {
            await signup(formData)
            // If we reach here without redirect, something went wrong
            // But signup should always redirect on success/error
            return { error: null, message: null, success: false }
        } catch (error: any) {
            // Check if it's a redirect error (from redirect() call)
            if (error?.digest?.startsWith('NEXT_REDIRECT')) {
                // Redirect is happening, let it proceed
                throw error
            }
            // Return error to be displayed
            return { error: error?.message || 'An unexpected error occurred. Please try again.', message: null, success: false }
        }
    }, { error: null, message: null, success: false })

    // Get error/message from URL params (for redirects from server action)
    const urlError = searchParams.get('error')
    const urlMessage = searchParams.get('message')

    // Reset form on successful submission (when message is shown)
    useEffect(() => {
        if (urlMessage && formRef.current) {
            formRef.current.reset()
        }
    }, [urlMessage])

    return (
        <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
            <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                <div className="text-center">
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-100">Create your account</h2>
                </div>
                <form ref={formRef} action={formAction} className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
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
                                autoComplete="new-password"
                                required
                                disabled={isPending}
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] placeholder-[#737373] text-[#f5f5f5] rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {(urlError || state.error) && (
                        <div className="text-red-400 text-sm text-center bg-[#1f1f1f] p-3 border border-red-500/30 rounded">
                            {urlError || state.error}
                        </div>
                    )}

                    {(urlMessage || state.message) && (
                        <div className="text-[#f5f5f5] text-sm text-center bg-[#1f1f1f] p-3 border border-[#262626] rounded">
                            {urlMessage || state.message}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPending ? 'Creating account...' : 'Sign up'}
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <a href="/login" className="font-medium text-[#f5f5f5] hover:opacity-80">
                            Already have an account? Sign in
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default function SignupPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
                <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                    <div className="text-center">
                        <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-100">Create your account</h2>
                    </div>
                    <div className="text-center text-gray-400">Loading...</div>
                </div>
            </div>
        }>
            <SignupForm />
        </Suspense>
    )
}
