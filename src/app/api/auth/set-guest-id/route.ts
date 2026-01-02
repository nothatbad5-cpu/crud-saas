import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * POST /api/auth/set-guest-id
 * Set guest_id cookie for guest users
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { guestId } = body
        
        if (!guestId || typeof guestId !== 'string') {
            return NextResponse.json(
                { error: 'guestId is required' },
                { status: 400 }
            )
        }
        
        const cookieStore = await cookies()
        cookieStore.set('guest_id', guestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 365, // 1 year
            path: '/',
        })
        
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error setting guest_id cookie:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to set guest_id' },
            { status: 500 }
        )
    }
}

