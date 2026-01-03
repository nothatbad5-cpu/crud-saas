/**
 * Supabase Email Confirmation Callback Route
 * 
 * When a user clicks the "Confirm your signup" email link from Supabase,
 * they are redirected here with a `code` query parameter. This route exchanges
 * that code for a session cookie, authenticating the user.
 * 
 * Without this route, email confirmation links would fail and users would not
 * be able to log in after confirming their email.
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=` + encodeURIComponent(error.message))
    }
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/login`)
}

