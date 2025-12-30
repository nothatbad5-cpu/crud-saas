import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema } from '@/lib/ai-command/schema'
import { executeActions } from '@/lib/ai-command/executor'
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
        const { actions, confirmToken } = body
        
        if (!actions || !Array.isArray(actions)) {
            return NextResponse.json(
                { error: 'Actions array is required' },
                { status: 400 }
            )
        }
        
        // Validate all actions
        const validatedActions = []
        for (const action of actions) {
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
            success: result.success,
            message: result.message,
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

