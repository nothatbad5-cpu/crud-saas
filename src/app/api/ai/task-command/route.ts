import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema, CommandResponseSchema } from '@/lib/ai-command/schema'
import { parseCommand } from '@/lib/ai-command/parser'
import { parseWithOpenAI } from '@/lib/ai/openaiTaskParser'
import { storePendingActions } from '@/lib/ai/confirmTokenStore'
import { computeRequiresConfirm, checkAmbiguousDeletes } from '@/lib/ai/confirm'
import { executeActions } from '@/lib/ai-command/executor'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

/**
 * POST /api/ai/task-command
 * Parse natural language command and return actions (with optional confirmation)
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
        const { input } = body
        
        if (!input || typeof input !== 'string' || !input.trim()) {
            return NextResponse.json(
                { error: 'Input is required' },
                { status: 400 }
            )
        }
        
        // Try OpenAI first (if configured)
        let actions: any[] = []
        let preview = ''
        
        const openaiApiKey = process.env.OPENAI_API_KEY
        
        if (openaiApiKey) {
            try {
                const aiResult = await parseWithOpenAI(input)
                actions = aiResult.actions
                preview = aiResult.preview
                // IGNORE aiResult.requiresConfirm - we compute it server-side
            } catch (aiError: any) {
                console.error('OpenAI parsing failed, falling back to rule-based parser:', aiError?.message || aiError)
                // Fall through to rule-based parser
            }
        }
        
        // Fallback to rule-based parser if OpenAI failed or not configured
        if (actions.length === 0) {
            const parsed = parseCommand(input)
            actions = parsed.actions
            preview = parsed.preview
            // IGNORE parsed.requiresConfirm - we compute it server-side
        }
        
        // Validate actions with Zod
        const validatedActions = []
        for (const action of actions) {
            const result = ActionSchema.safeParse(action)
            if (result.success) {
                validatedActions.push(result.data)
            } else {
                return NextResponse.json({
                    error: `Invalid action: ${result.error.message}`,
                    actions: [],
                    preview: 'Could not validate command',
                    requiresConfirm: false,
                }, { status: 400 })
            }
        }
        
        // SINGLE SOURCE OF TRUTH: Compute requiresConfirm server-side
        let requiresConfirm = computeRequiresConfirm(validatedActions)
        
        // Check for ambiguous deletes (multiple matches)
        if (requiresConfirm) {
            const ambiguousCheck = await checkAmbiguousDeletes(user.id, validatedActions)
            if (ambiguousCheck.isAmbiguous) {
                // Return noop for ambiguous deletes
                return NextResponse.json({
                    preview: ambiguousCheck.message || 'Ambiguous command',
                    requiresConfirm: false,
                    resultMessage: ambiguousCheck.message || 'Please be more specific',
                    actionsExecutedCount: 0,
                    actions: [], // Not needed for noop
                })
            }
        }
        
        // If no confirmation needed, execute immediately
        if (!requiresConfirm) {
            const result = await executeActions(user.id, validatedActions)
            
            // Revalidate dashboard
            revalidatePath('/dashboard')
            
            return NextResponse.json({
                preview,
                requiresConfirm: false,
                resultMessage: result.message,
                actionsExecutedCount: result.affectedCount,
                actions: [], // Not needed for immediate execution
            })
        }
        
        // Confirmation required - generate token and store pending actions
        const confirmToken = crypto.randomBytes(32).toString('hex')
        storePendingActions(confirmToken, user.id, validatedActions, preview)
        
        return NextResponse.json({
            preview,
            requiresConfirm: true,
            confirmToken,
            actions: validatedActions, // Include for reference (not executed yet)
        })
    } catch (error: any) {
        console.error('Error in task-command API:', error)
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}


