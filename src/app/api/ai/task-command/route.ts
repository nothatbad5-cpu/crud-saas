import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema, CommandResponseSchema } from '@/lib/ai-command/schema'
import { parseCommand } from '@/lib/ai-command/parser'
import { parseWithOpenAI } from '@/lib/ai/openaiTaskParser'
import { storePendingActions } from '@/lib/ai/confirmTokenStore'
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
        let requiresConfirm = false
        
        const openaiApiKey = process.env.OPENAI_API_KEY
        
        if (openaiApiKey) {
            try {
                const aiResult = await parseWithOpenAI(input)
                actions = aiResult.actions
                preview = aiResult.preview
                requiresConfirm = aiResult.requiresConfirm
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
            requiresConfirm = parsed.requiresConfirm
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
        
        // Check if confirmation is required
        // - bulk_delete_all always requires confirmation
        // - delete with weak match (contains) requires confirmation
        // - multiple matches require confirmation
        if (validatedActions.some(a => a.type === 'bulk_delete_all')) {
            requiresConfirm = true
        }
        
        // Check for delete actions with title match (weak matching requires confirm)
        for (const action of validatedActions) {
            if (action.type === 'delete' && action.match.title && !action.match.id) {
                // Title-based delete requires confirmation for safety
                requiresConfirm = true
                break
            }
        }
        
        // Generate confirmation token if needed
        let confirmToken: string | undefined
        if (requiresConfirm) {
            confirmToken = crypto.randomBytes(32).toString('hex')
            // Store pending actions with token
            storePendingActions(confirmToken, user.id, validatedActions)
        }
        
        const response = {
            actions: validatedActions,
            preview,
            requiresConfirm,
            confirmToken,
        }
        
        // Validate response schema
        const validated = CommandResponseSchema.safeParse(response)
        if (!validated.success) {
            return NextResponse.json({
                error: 'Internal error: invalid response format',
            }, { status: 500 })
        }
        
        return NextResponse.json(validated.data)
    } catch (error: any) {
        console.error('Error in task-command API:', error)
        return NextResponse.json(
            { error: error.message || 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}


