/**
 * In-memory confirmation token store (MVP)
 * In production, use Redis or similar for persistence across instances
 */

interface PendingAction {
    userId: string
    actions: any[]
    preview: string
    createdAt: number
}

const tokenStore = new Map<string, PendingAction>()

// Cleanup old tokens (older than 10 minutes)
const CLEANUP_INTERVAL = 10 * 60 * 1000 // 10 minutes
const MAX_AGE = 10 * 60 * 1000 // 10 minutes

setInterval(() => {
    const now = Date.now()
    for (const [token, data] of tokenStore.entries()) {
        if (now - data.createdAt > MAX_AGE) {
            tokenStore.delete(token)
        }
    }
}, CLEANUP_INTERVAL)

export function storePendingActions(token: string, userId: string, actions: any[], preview: string): void {
    tokenStore.set(token, {
        userId,
        actions,
        preview,
        createdAt: Date.now(),
    })
}

export function getPendingActions(token: string, userId: string): { actions: any[]; preview: string } | null {
    const data = tokenStore.get(token)
    
    if (!data) {
        return null
    }
    
    // Verify user matches
    if (data.userId !== userId) {
        return null
    }
    
    // Check if expired (10 minutes as per requirements)
    if (Date.now() - data.createdAt > MAX_AGE) {
        tokenStore.delete(token)
        return null
    }
    
    // Delete after retrieval (one-time use)
    tokenStore.delete(token)
    
    return {
        actions: data.actions,
        preview: data.preview,
    }
}

