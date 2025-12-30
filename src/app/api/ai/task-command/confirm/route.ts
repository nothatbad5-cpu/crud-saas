import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema } from '@/lib/ai-command/schema'
import { executeActions } from '@/lib/ai-command/executor'
import { getPendingActions } from '@/lib/ai/confirmTokenStore'
import { revalidatePath } from 'next/cache'

/**
 * POST /api/ai/task-command/confirm
 * Execute confirmed actions
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized. Please sign in.' },
                { status: 401 }
            )
        }
        
        const body = await request.json()
        const { confirmToken } = body
        
        if (!confirmToken || typeof confirmToken !== 'string') {
            return NextResponse.json(
                { error: 'Confirmation token is required' },
                { status: 400 }
            )
        }
        
        // Look up pending actions
        const pendingData = getPendingActions(confirmToken, user.id)
        
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
        const result = await executeActions(user.id, validatedActions)
        
        // Revalidate dashboard
        revalidatePath('/dashboard')
        
        return NextResponse.json({
            resultMessage: result.message,
            preview: pendingData.preview,
            requiresConfirm: false,
            success: result.success,
            affectedCount: result.affectedCount,
        })
    } catch (error: any) {
        console.error('Error in task-command confirm API:', error)
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}

