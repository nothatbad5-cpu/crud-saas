/**
 * OpenAI parser for natural language task commands
 * Server-side only - never expose API key to client
 */

import OpenAI from 'openai'
import { Action, CommandResponseSchema } from '@/lib/ai-command/schema'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

/**
 * Parse natural language command using OpenAI
 * Returns validated actions or throws error (caller should fallback)
 */
export async function parseWithOpenAI(input: string): Promise<{
    actions: Action[]
    preview: string
    requiresConfirm: boolean
}> {
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured')
    }

    const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
    })

    const systemPrompt = `You are a task management assistant. Parse user commands into JSON actions.

CRITICAL RULES:
1. Output ONLY valid JSON matching this exact schema. No markdown, no code blocks, no explanations.
2. Default to CREATE action if the command doesn't explicitly say delete/rename/mark/update.
3. ALWAYS extract dates and times from natural language. Examples:
   - "ride to toronto on 3rd jan 2026" → dueDate: "2026-01-03T00:00:00Z"
   - "meeting on 2nd jan 2026 at 3pm" → dueDate: "2026-01-02T15:00:00Z"
   - "tomorrow 7pm" → dueDate: tomorrow's date at 19:00 UTC
   - "next friday" → dueDate: next Friday at 00:00 UTC
4. For delete/bulk_delete_all: set requiresConfirm=true.
5. For ambiguous matches (multiple tasks could match): set requiresConfirm=true and return noop with reason.
6. If command is unclear, return noop with helpful reason.

ACTION SCHEMA:
- create: { type:"create", title:string (1-120 chars), description?:string, status?:"pending"|"completed", dueDate?:string (ISO 8601 format, e.g. "2026-01-03T00:00:00Z" or "2026-01-02T15:00:00Z") }
- update: { type:"update", match:{ id?:string, title?:string }, patch:{ title?:string, description?:string, status?:"pending"|"completed", dueDate?:string|null (ISO 8601) } }
- delete: { type:"delete", match:{ id?:string, title?:string }, limit?:number }
- bulk_delete_all: { type:"bulk_delete_all" }
- noop: { type:"noop", reason:string }

OUTPUT FORMAT (JSON only):
{
  "actions": [Action],
  "preview": "Human-readable description of what will happen",
  "requiresConfirm": boolean
}

EXAMPLES:
Input: "buy milk" → { "actions": [{"type":"create","title":"buy milk"}], "preview": "Create task: buy milk", "requiresConfirm": false }
Input: "ride to toronto on 3rd jan 2026" → { "actions": [{"type":"create","title":"ride to toronto","dueDate":"2026-01-03T00:00:00Z"}], "preview": "Create task: ride to toronto (due: 2026-01-03)", "requiresConfirm": false }
Input: "ride to toronto on 2nd jan 2026 at 3pm" → { "actions": [{"type":"create","title":"ride to toronto","dueDate":"2026-01-02T15:00:00Z"}], "preview": "Create task: ride to toronto (due: 2026-01-02 3pm)", "requiresConfirm": false }
Input: "mark buy milk complete" → { "actions": [{"type":"update","match":{"title":"buy milk"},"patch":{"status":"completed"}}], "preview": "Mark 'buy milk' as complete", "requiresConfirm": false }
Input: "delete buy milk" → { "actions": [{"type":"delete","match":{"title":"buy milk"}}], "preview": "Delete task matching: buy milk", "requiresConfirm": true }
Input: "clear all tasks" → { "actions": [{"type":"bulk_delete_all"}], "preview": "Delete all tasks", "requiresConfirm": true }`

    try {
        const completion = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content: systemPrompt,
                },
                {
                    role: 'user',
                    content: input,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 500,
        })

        const messageContent = completion.choices[0]?.message?.content

        if (!messageContent) {
            throw new Error('No content in OpenAI response')
        }

        // Parse JSON response
        let parsed
        try {
            parsed = typeof messageContent === 'string' ? JSON.parse(messageContent) : messageContent
        } catch (e) {
            throw new Error(`Invalid JSON in OpenAI response: ${e}`)
        }

        // Validate structure
        if (!parsed.actions || !Array.isArray(parsed.actions)) {
            throw new Error('OpenAI response missing actions array')
        }

        if (typeof parsed.preview !== 'string') {
            throw new Error('OpenAI response missing preview string')
        }

        if (typeof parsed.requiresConfirm !== 'boolean') {
            parsed.requiresConfirm = false
        }

        // Validate with Zod schema
        const validated = CommandResponseSchema.safeParse({
            actions: parsed.actions,
            preview: parsed.preview,
            requiresConfirm: parsed.requiresConfirm,
        })

        if (!validated.success) {
            throw new Error(`OpenAI response validation failed: ${validated.error.message}`)
        }

        return {
            actions: validated.data.actions,
            preview: validated.data.preview,
            requiresConfirm: validated.data.requiresConfirm,
        }
    } catch (error: any) {
        // Re-throw with context
        if (error instanceof Error) {
            throw new Error(`OpenAI parsing failed: ${error.message}`)
        }
        throw new Error('OpenAI parsing failed: Unknown error')
    }
}

