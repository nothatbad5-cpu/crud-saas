/**
 * In-memory confirmation token store (MVP)
 * In production, use Redis or similar for persistence across instances
 */

interface PendingAction {
    userId: string
    actions: any[]
    createdAt: number
}

const tokenStore = new Map<string, PendingAction>()

// Cleanup old tokens (older than 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000 // 5 minutes
const MAX_AGE = 5 * 60 * 1000 // 5 minutes

setInterval(() => {
    const now = Date.now()
    for (const [token, data] of tokenStore.entries()) {
        if (now - data.createdAt > MAX_AGE) {
            tokenStore.delete(token)
        }
    }
}, CLEANUP_INTERVAL)

export function storePendingActions(token: string, userId: string, actions: any[]): void {
    tokenStore.set(token, {
        userId,
        actions,
        createdAt: Date.now(),
    })
}

export function getPendingActions(token: string, userId: string): any[] | null {
    const data = tokenStore.get(token)
    
    if (!data) {
        return null
    }
    
    // Verify user matches
    if (data.userId !== userId) {
        return null
    }
    
    // Check if expired
    if (Date.now() - data.createdAt > MAX_AGE) {
        tokenStore.delete(token)
        return null
    }
    
    // Delete after retrieval (one-time use)
    tokenStore.delete(token)
    
    return data.actions
}

