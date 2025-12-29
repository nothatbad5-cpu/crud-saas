# Troubleshooting Guide: Authentication Errors in Production

## ✅ Confirmed Setup

- **Environment Variables:** Set in Vercel
  - `NEXT_PUBLIC_SUPABASE_URL`: `https://nogqzslrpjslxrhntndq.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Set (JWT token)
- **Code:** Auth actions have proper error handling
- **Supabase Client:** Correctly configured to read env vars

## 🔍 Root Cause Analysis

The error "An unexpected error occurred. Please try again." comes from the `catch` block in `src/app/auth/actions.ts` (lines 40-49 for login, 95-104 for signup). This means an exception is being thrown that's not a redirect error.

### Possible Causes:

1. **Supabase Connection Issue**
   - Network timeout
   - Supabase service unavailable
   - CORS issues

2. **Supabase Auth Configuration**
   - Email confirmation required but not configured
   - Rate limiting on signup/login
   - RLS policies blocking auth operations

3. **Environment Variable Access**
   - Variables set but not accessible at runtime
   - Build-time vs runtime variable mismatch
   - Need to redeploy after setting variables

4. **Cookie/Session Issues**
   - Cookie setting failing in server action
   - Middleware conflicts

## 🛠️ Diagnostic Steps

### Step 1: Check Vercel Function Logs

1. Go to **Vercel Dashboard** → Your Project → **Functions** tab
2. Click on **Logs** or **Runtime Logs**
3. Look for entries with:
   - `"Signup Error:"` or `"Login Error:"`
   - These will show the actual exception details
4. Check for:
   - Error message
   - Error status code
   - Stack trace

**What to look for:**
```
Signup Error: {
  message: "...",
  status: ...,
  name: "...",
  full: ...
}
```

### Step 2: Test Manually in Production

1. Visit: https://crud-saas-three.vercel.app/signup
2. Open browser DevTools (F12)
3. Go to **Console** tab
4. Try to sign up with a test email
5. Check for:
   - Console errors
   - Network tab → failed requests
   - Response from `/signup` endpoint

### Step 3: Verify Supabase Auth Settings

1. Go to **Supabase Dashboard** → Your Project → **Authentication** → **Settings**
2. Check:
   - **Email Confirmation:** Is it enabled?
     - If YES: Users must confirm email before login
     - If NO: Should work immediately
   - **Rate Limiting:** Check if signup/login is rate-limited
   - **Site URL:** Should match your Vercel URL
   - **Redirect URLs:** Should include your Vercel domain

### Step 4: Check Supabase Project Status

1. Go to **Supabase Dashboard** → Your Project
2. Check:
   - Project status (should be "Active")
   - API status (should be "Healthy")
   - Database status

### Step 5: Verify Environment Variables in Vercel

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
2. Verify:
   - Variables are set for **Production** environment
   - Variables are spelled correctly (case-sensitive)
   - No extra spaces or quotes
3. **Important:** After adding/changing env vars, you MUST redeploy

## 🔧 Quick Fixes to Try

### Fix 1: Redeploy After Setting Env Vars

If you just added the env vars:
1. Go to **Vercel Dashboard** → Your Project → **Deployments**
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger redeploy

### Fix 2: Check Email Confirmation Settings

If email confirmation is enabled:
1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Disable "Enable email confirmations" (for testing)
3. Or configure email templates properly

### Fix 3: Add More Detailed Error Logging

Update `src/app/auth/actions.ts` to log more details:

```typescript
} catch (error: any) {
    if (isRedirectError(error)) throw error
    
    // Enhanced logging
    console.error('Signup Error Details:', {
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        name: error?.name,
        code: error?.code,
        stack: error?.stack,
        full: JSON.stringify(error, null, 2)
    })
    
    redirect('/signup?error=' + encodeURIComponent('An unexpected error occurred. Please try again.'))
}
```

### Fix 4: Test Supabase Connection Directly

Create a test API route to verify Supabase connection:

```typescript
// src/app/api/test-supabase/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data, error } = await supabase.from('tasks').select('count').limit(1)
        
        return NextResponse.json({
            success: !error,
            error: error?.message,
            env: {
                url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
                key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
```

Then visit: `https://crud-saas-three.vercel.app/api/test-supabase`

## 📋 Next Steps Based on Findings

### If Logs Show "Missing env vars":
- Verify variables are set in Vercel
- Redeploy after setting variables
- Check variable names (case-sensitive)

### If Logs Show Supabase Connection Error:
- Check Supabase project status
- Verify network connectivity
- Check CORS settings

### If Logs Show Auth Error:
- Check Supabase Auth settings
- Verify email confirmation settings
- Check rate limiting

### If Logs Show Cookie Error:
- Check middleware configuration
- Verify cookie settings in Supabase client

## 🎯 Expected Outcome

After fixing the issue:
1. Manual signup/login should work in production
2. All 16 E2E tests should pass
3. No more "An unexpected error occurred" messages

---

**Priority:** Check Vercel function logs first - they will reveal the exact error causing the catch block to execute.

