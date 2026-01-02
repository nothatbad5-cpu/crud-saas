import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema } from '@/lib/ai-command/schema'
import { executeActions } from '@/lib/ai-command/executor'
import { getPendingActions } from '@/lib/ai/confirmTokenStore'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { cookies } from 'next/headers'

/**
 * POST /api/ai/task-command/confirm
 * Execute confirmed actions
 */
export async function POST(request: NextRequest) {
    const requestId = randomUUID()
    
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        // Get guest_id from cookie if no authenticated user
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value
        
        // STRICT IDENTITY CHECK - must have user OR guest_id
        if ((authError || !user) && !guestId) {
            console.error(`[${requestId}] Auth failed:`, authError?.message || 'No user or guest_id')
            return NextResponse.json(
                { 
                    ok: false,
                    error: 'Not authenticated. Please sign in.',
                    requestId 
                },
                { status: 401 }
            )
        }
        
        const identityId = user?.id || guestId
        const isGuest = !user && !!guestId
        
        if (!identityId) {
            return NextResponse.json(
                { 
                    ok: false,
                    error: 'No identity found',
                    requestId 
                },
                { status: 401 }
            )
        }
        
        console.log(`[${requestId}] Identity:`, isGuest ? `guest ${identityId}` : `user ${identityId}`)
        
        const body = await request.json()
        const { confirmToken } = body
        
        if (!confirmToken || typeof confirmToken !== 'string') {
            return NextResponse.json(
                { error: 'Confirmation token is required' },
                { status: 400 }
            )
        }
        
        // Look up pending actions (use identityId)
        const pendingData = getPendingActions(confirmToken, identityId)
        
        if (!pendingData) {
            return NextResponse.json(
                { error: 'Invalid or expired confirmation token' },
                { status: 400 }
            )
        }
        
        // Validate all actions
        const validatedActions = []
        for (const action of pendingData.actions) {
            const result = ActionSchema.safeParse(action)
            if (result.success) {
                validatedActions.push(result.data)
            } else {
                return NextResponse.json({
                    error: `Invalid action: ${result.error.message}`,
                }, { status: 400 })
            }
        }
        
        // Execute actions
        console.log(`[${requestId}] Executing ${validatedActions.length} confirmed actions`)
        const result = await executeActions(user?.id || null, validatedActions, guestId || null)
        
        // Log each action result
        for (const actionResult of result.results) {
            console.log(`[${requestId}] Action ${actionResult.type}: ok=${actionResult.ok}, id=${actionResult.id || 'none'}, error=${actionResult.error || 'none'}`)
        }
        
        // Only revalidate if execution succeeded
        if (result.success) {
            revalidatePath('/dashboard')
            console.log(`[${requestId}] Revalidated /dashboard`)
        }
        
        // Separate results by type
        const created = result.results.filter(r => r.type === 'create' && r.ok && r.id).map(r => ({
            id: r.id!,
            title: r.title!,
            due_at: r.due_at || null,
            due_date: r.due_at ? r.due_at.split('T')[0] : null
        }))
        
        const updated = result.results.filter(r => r.type === 'update' && r.ok && r.id).map(r => ({
            id: r.id!,
            title: r.title!,
            due_at: r.due_at || null,
            due_date: r.due_at ? r.due_at.split('T')[0] : null
        }))
        
        const deleted = result.results.filter(r => r.type === 'delete' && r.ok && r.id).map(r => ({
            id: r.id!,
            title: r.title!
        }))
        
        return NextResponse.json({
            requestId,
            ok: result.success,
            resultMessage: result.message,
            preview: pendingData.preview,
            requiresConfirm: false,
            success: result.success,
            actionsApplied: result.affectedCount,
            created,
            updated,
            deleted,
            results: result.results,
            error: result.success ? undefined : result.message,
        })
    } catch (error: any) {
        console.error('Error in task-command confirm API:', error)
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}

