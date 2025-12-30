import { z } from 'zod'

/**
 * Strict schema for AI command actions
 * Only these action types are allowed - no arbitrary SQL or table access
 */

export const ActionSchema = z.discriminatedUnion('type', [
    // Create a new task
    z.object({
        type: z.literal('create'),
        title: z.string().min(1).max(120),
        description: z.string().max(500).optional(),
        status: z.enum(['pending', 'completed']).optional(),
        dueDate: z.string().optional(), // ISO date string or natural language
    }),
    // Update an existing task
    z.object({
        type: z.literal('update'),
        match: z.object({
            id: z.string().uuid().optional(),
            title: z.string().min(1).max(120).optional(),
        }).refine(data => data.id || data.title, {
            message: 'Must provide either id or title to match',
        }),
        patch: z.object({
            title: z.string().min(1).max(120).optional(),
            description: z.string().max(500).optional(),
            status: z.enum(['pending', 'completed']).optional(),
            dueDate: z.string().nullable().optional(), // ISO date string or natural language, null to clear
        }).refine(data => Object.keys(data).length > 0, {
            message: 'Must provide at least one field to update',
        }),
    }),
    // Delete one or more tasks
    z.object({
        type: z.literal('delete'),
        match: z.object({
            id: z.string().uuid().optional(),
            title: z.string().min(1).max(120).optional(),
        }).refine(data => data.id || data.title, {
            message: 'Must provide either id or title to match',
        }),
        limit: z.number().int().positive().max(100).optional(), // Max 100 deletions per command
    }),
    // Bulk delete all tasks (always requires confirmation)
    z.object({
        type: z.literal('bulk_delete_all'),
    }),
    // No operation (for ambiguous commands)
    z.object({
        type: z.literal('noop'),
        reason: z.string().min(1),
    }),
])

export type Action = z.infer<typeof ActionSchema>

export const CommandResponseSchema = z.object({
    actions: z.array(ActionSchema),
    preview: z.string(),
    requiresConfirm: z.boolean(),
    confirmToken: z.string().optional(),
})

export type CommandResponse = z.infer<typeof CommandResponseSchema>

