'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Action, CommandResponse } from '@/lib/ai-command/schema'

interface AICommandBarProps {
    onSuccess?: () => void
}

export default function AICommandBar({ onSuccess }: AICommandBarProps) {
    const router = useRouter()
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [result, setResult] = useState<CommandResponse | null>(null)
    const [executionResult, setExecutionResult] = useState<{ success: boolean; message: string } | null>(null)
    const [isConfirming, setIsConfirming] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        setIsLoading(true)
        setResult(null)
        setExecutionResult(null)

        try {
            const response = await fetch('/api/ai/task-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ input: input.trim() }),
            })

            const data = await response.json()

            if (!response.ok) {
                setExecutionResult({
                    success: false,
                    message: data.error || 'Failed to parse command',
                })
                return
            }

            // If no confirmation needed, verify actual success with HARD PROOF
            if (!data.requiresConfirm) {
                // Check response.ok first
                if (!response.ok || data.ok !== true) {
                    setExecutionResult({
                        success: false,
                        message: data.error || 'Failed to execute command',
                    })
                    return
                }
                
                // HARD PROOF: Must have actual created/updated/deleted IDs
                const hasCreated = data.created && data.created.length > 0 && data.created[0].id
                const hasUpdated = data.updated && data.updated.length > 0 && data.updated[0].id
                const hasDeleted = data.deleted && data.deleted.length > 0 && data.deleted[0].id
                const actuallySucceeded = hasCreated || hasUpdated || hasDeleted
                
                if (actuallySucceeded) {
                    // Build success message with actual task info
                    let successMsg = data.resultMessage || 'Command executed successfully'
                    if (hasCreated) {
                        successMsg = `Created task: "${data.created[0].title}" (ID: ${data.created[0].id.substring(0, 8)}...)`
                    }
                    
                    setExecutionResult({
                        success: true,
                        message: successMsg + (data.requestId ? ` [${data.requestId.substring(0, 8)}...]` : ''),
                    })
                    // Clear input and refresh
                    setInput('')
                    if (onSuccess) {
                        onSuccess()
                    } else {
                        // Use router.refresh() for Next.js App Router
                        router.refresh()
                    }
                } else {
                    // Show error - no actual IDs returned
                    setExecutionResult({
                        success: false,
                        message: data.error || 'Task was not created. No ID returned from server.',
                    })
                }
                return
            }

            // Confirmation required - show preview and buttons
            setResult({
                preview: data.preview,
                requiresConfirm: true,
                confirmToken: data.confirmToken,
                actions: [], // Not needed for confirm flow
            })
        } catch (error: any) {
            setExecutionResult({
                success: false,
                message: error.message || 'An unexpected error occurred',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleConfirm = async () => {
        if (!result || !result.confirmToken) return
        
        setIsConfirming(true)
        try {
            const response = await fetch('/api/ai/task-command/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ confirmToken: result.confirmToken }),
            })

            const data = await response.json()

            if (!response.ok) {
                // Handle "Confirmation token is required" or expired token
                if (data.error?.includes('token')) {
                    setExecutionResult({
                        success: false,
                        message: 'Confirmation expired. Please try again.',
                    })
                    setResult(null)
                } else {
                    setExecutionResult({
                        success: false,
                        message: data.error || 'Failed to execute command',
                    })
                }
                return
            }

            // Verify actual success with HARD PROOF
            if (!response.ok || data.ok !== true) {
                setExecutionResult({
                    success: false,
                    message: data.error || 'Failed to execute command',
                })
                return
            }
            
            const hasCreated = data.created && data.created.length > 0 && data.created[0].id
            const hasUpdated = data.updated && data.updated.length > 0 && data.updated[0].id
            const hasDeleted = data.deleted && data.deleted.length > 0 && data.deleted[0].id
            const actuallySucceeded = hasCreated || hasUpdated || hasDeleted
            
            setExecutionResult({
                success: actuallySucceeded,
                message: actuallySucceeded 
                    ? (data.resultMessage || 'Command executed successfully')
                    : (data.error || 'Task was not created. No ID returned from server.'),
            })

            // Clear input and result on success
            if (actuallySucceeded) {
                setInput('')
                setResult(null)
                // Trigger refresh
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.refresh()
                }
            }
        } catch (error: any) {
            setExecutionResult({
                success: false,
                message: error.message || 'An unexpected error occurred',
            })
        } finally {
            setIsConfirming(false)
        }
    }

    const handleCancel = () => {
        setResult(null)
        setExecutionResult(null)
        setInput('')
    }

    return (
        <div className="mb-4 md:mb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Tell AI what to do…"
                        disabled={isLoading || isConfirming}
                        className="flex-1 h-10 px-3 text-sm bg-[#0f0f0f] text-[#f5f5f5] border border-[#262626] rounded-md placeholder:text-[#737373] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || isConfirming || !input.trim()}
                        className="h-10 px-4 text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Working…' : 'Run'}
                    </button>
                </div>
            </form>

            {/* Result Display */}
            {(result || executionResult) && (
                <div className="mt-3 p-3 bg-[#111] border border-[#262626] rounded-xl text-sm">
                    {result && (
                        <div className="mb-2">
                            <div className="text-[#a3a3a3] text-xs mb-1">AI understood:</div>
                            <div className="text-[#f5f5f5]">{result.preview}</div>
                        </div>
                    )}

                    {executionResult && (
                        <div className="mb-2">
                            <div className="text-[#a3a3a3] text-xs mb-1">Result:</div>
                            <div className={executionResult.success ? 'text-[#f5f5f5]' : 'text-[#f5f5f5]'}>
                                {executionResult.message}
                            </div>
                        </div>
                    )}

                    {/* Confirmation Buttons */}
                    {result && result.requiresConfirm && !executionResult && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleConfirm}
                                disabled={isConfirming}
                                className="flex-1 h-9 px-3 text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConfirming ? 'Working…' : 'Confirm'}
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isConfirming}
                                className="flex-1 h-9 px-3 text-sm font-medium text-[#f5f5f5] bg-[#161616] border border-[#262626] hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    )}

                    {/* Close button for non-confirm results */}
                    {executionResult && !result?.requiresConfirm && (
                        <button
                            onClick={handleCancel}
                            className="mt-2 text-xs text-[#a3a3a3] hover:text-[#f5f5f5]"
                        >
                            Close
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

