'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function isRedirectError(error: any) {
    return error?.digest?.startsWith('NEXT_REDIRECT')
}

export async function login(formData: FormData) {
    try {
        const supabase = await createClient()

        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }

        if (!data.email || !data.password) {
            redirect('/login?error=' + encodeURIComponent('Email and password are required'))
            return
        }

        const { error } = await supabase.auth.signInWithPassword(data)

        if (error) {
            // Provide more specific error messages
            const errorMessage = error.message.includes('Invalid login')
                ? 'Invalid email or password'
                : error.message.includes('Email not confirmed')
                    ? 'Please verify your email before signing in'
                    : error.message || 'Could not authenticate user'
            redirect('/login?error=' + encodeURIComponent(errorMessage))
            return
        }

        revalidatePath('/', 'layout')
        redirect('/dashboard')
    } catch (error: any) {
        if (isRedirectError(error)) throw error
        console.error('Login Error:', {
            message: error.message,
            status: error.status,
            name: error.name,
            full: error
        })
        redirect('/login?error=' + encodeURIComponent('An unexpected error occurred. Please try again.'))
    }
}

export async function signup(formData: FormData) {
    try {
        const supabase = await createClient()

        const data = {
            email: formData.get('email') as string,
            password: formData.get('password') as string,
        }


        if (!data.email || !data.password) {
            redirect('/signup?error=' + encodeURIComponent('Email and password are required'))
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            redirect('/signup?error=' + encodeURIComponent('Please enter a valid email address'))
            return
        }

        // Basic password validation
        if (data.password.length < 6) {
            redirect('/signup?error=' + encodeURIComponent('Password must be at least 6 characters'))
            return
        }

        const { error } = await supabase.auth.signUp(data)

        if (error) {
            // Provide more specific error messages
            const errorMessage = error.message.includes('already registered')
                ? 'An account with this email already exists'
                : error.message.includes('Password')
                    ? 'Password does not meet requirements'
                    : error.message || 'Could not create user'
            redirect('/signup?error=' + encodeURIComponent(errorMessage))
            return
        }

        revalidatePath('/', 'layout')
        redirect('/dashboard')
    } catch (error: any) {
        if (isRedirectError(error)) throw error
        console.error('Signup Error:', {
            message: error.message,
            status: error.status,
            name: error.name,
            full: error
        })
        redirect('/signup?error=' + encodeURIComponent('An unexpected error occurred. Please try again.'))
    }
}
