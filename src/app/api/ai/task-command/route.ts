import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ActionSchema, CommandResponseSchema } from '@/lib/ai-command/schema'
import { parseCommand } from '@/lib/ai-command/parser'
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
        
        // Try AI provider first (if configured)
        let actions: any[] = []
        let preview = ''
        let requiresConfirm = false
        
        const aiProvider = process.env.AI_PROVIDER
        const aiApiKey = process.env.AI_API_KEY
        
        if (aiProvider && aiApiKey) {
            // Use AI provider to parse command
            try {
                const aiResult = await parseWithAI(input, aiProvider, aiApiKey)
                actions = aiResult.actions
                preview = aiResult.preview
                requiresConfirm = aiResult.requiresConfirm
            } catch (aiError) {
                console.error('AI parsing failed, falling back to rule-based parser:', aiError)
                // Fall through to rule-based parser
            }
        }
        
        // Fallback to rule-based parser if AI failed or not configured
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
        if (validatedActions.some(a => a.type === 'bulk_delete_all')) {
            requiresConfirm = true
        }
        
        // Generate confirmation token if needed
        let confirmToken: string | undefined
        if (requiresConfirm) {
            confirmToken = crypto.randomBytes(32).toString('hex')
            // Store token in session/cache (simplified - in production use Redis or similar)
            // For now, we'll include it in the response and validate it on confirm
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

/**
 * Parse command using AI provider (OpenAI, Anthropic, etc.)
 */
async function parseWithAI(
    input: string,
    provider: string,
    apiKey: string
): Promise<{ actions: any[]; preview: string; requiresConfirm: boolean }> {
    // This is a placeholder - implement based on your AI provider
    // Example for OpenAI:
    if (provider.toLowerCase() === 'openai') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a task management assistant. Parse user commands into JSON actions.
Available actions:
- create: { type: "create", title: string, description?: string, status?: "pending"|"completed", dueDate?: string }
- update: { type: "update", match: { id?: string, title?: string }, patch: { title?: string, description?: string, status?: "pending"|"completed", dueDate?: string|null } }
- delete: { type: "delete", match: { id?: string, title?: string }, limit?: number }
- bulk_delete_all: { type: "bulk_delete_all" }
- noop: { type: "noop", reason: string }

Return JSON array of actions. Set requiresConfirm=true for bulk_delete_all or ambiguous deletes.`,
                    },
                    {
                        role: 'user',
                        content: input,
                    },
                ],
                response_format: { type: 'json_object' },
                temperature: 0.3,
            }),
        })
        
        if (!response.ok) {
            throw new Error(`AI API error: ${response.statusText}`)
        }
        
        const data = await response.json()
        const messageContent = data.choices[0]?.message?.content
        
        if (!messageContent) {
            throw new Error('No content in AI response')
        }
        
        let content
        try {
            content = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent
        } catch (e) {
            throw new Error('Invalid JSON in AI response')
        }
        
        // Handle both array and single action
        const actions = Array.isArray(content.actions) 
            ? content.actions 
            : content.action 
            ? [content.action]
            : content.actions
            ? [content.actions]
            : []
        
        return {
            actions,
            preview: content.preview || content.message || 'AI parsed command',
            requiresConfirm: content.requiresConfirm || false,
        }
    }
    
    // Add other providers (Anthropic, etc.) here
    
    throw new Error(`Unsupported AI provider: ${provider}`)
}

