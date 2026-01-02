'use client'

import { useState, useEffect } from 'react'
import { toggleTaskStatus } from '@/app/dashboard/calendar-actions'
import { formatTimeISO, formatDateISO, formatDateReadable, formatTime12Hour, startOfDayKey } from '@/lib/date'
import { useRouter } from 'next/navigation'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_at: string | null
    due_date: string | null
    created_at: string
}

interface TaskGroup {
    key: string
    label: string
    tasks: Task[]
}

interface UpcomingTasksProps {
    groups: TaskGroup[]
}

interface UndoState {
    taskId: string
    task: Task
    originalGroups: TaskGroup[]
    timer: NodeJS.Timeout
}

export default function UpcomingTasks({ groups: initialGroups }: UpcomingTasksProps) {
    const [groups, setGroups] = useState(initialGroups)
    const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
    const [undoState, setUndoState] = useState<UndoState | null>(null)
    const router = useRouter()

    // Cleanup undo timer on unmount
    useEffect(() => {
        return () => {
            if (undoState?.timer) {
                clearTimeout(undoState.timer)
            }
        }
    }, [undoState])

    const handleDone = async (taskId: string) => {
        // Find the task before removing it
        let taskToComplete: Task | null = null
        let originalGroupsSnapshot = groups
        for (const group of groups) {
            const task = group.tasks.find(t => t.id === taskId)
            if (task) {
                taskToComplete = task
                break
            }
        }

        if (!taskToComplete) return

        // Optimistic update: remove task immediately
        setCompletingIds(prev => new Set(prev).add(taskId))
        
        const updatedGroups = groups.map(group => ({
            ...group,
            tasks: group.tasks.filter(task => task.id !== taskId)
        })).filter(group => group.tasks.length > 0)
        
        setGroups(updatedGroups)

        try {
            // Mark as completed in database
            const result = await toggleTaskStatus(taskId)
            
            if (result.error) {
                // Revert on error
                setGroups(originalGroupsSnapshot)
                console.error('Failed to complete task:', result.error)
                setCompletingIds(prev => {
                    const next = new Set(prev)
                    next.delete(taskId)
                    return next
                })
            } else {
                // Set up undo state (5 second window)
                const timer = setTimeout(() => {
                    setUndoState(null)
                    router.refresh()
                }, 5000)

                setUndoState({
                    taskId,
                    task: taskToComplete,
                    originalGroups: originalGroupsSnapshot,
                    timer
                })
            }
        } catch (error) {
            // Revert on error
            setGroups(originalGroupsSnapshot)
            console.error('Error completing task:', error)
            setCompletingIds(prev => {
                const next = new Set(prev)
                next.delete(taskId)
                return next
            })
        } finally {
            setCompletingIds(prev => {
                const next = new Set(prev)
                next.delete(taskId)
                return next
            })
        }
    }

    const handleUndo = async () => {
        if (!undoState) return

        // Clear the timer
        clearTimeout(undoState.timer)

        // Restore task to groups
        setGroups(undoState.originalGroups)
        setUndoState(null)

        try {
            // Revert status back to pending
            const result = await toggleTaskStatus(undoState.taskId)
            if (result.error) {
                console.error('Failed to undo task:', result.error)
                // Still refresh to sync with server
                router.refresh()
            } else {
                router.refresh()
            }
        } catch (error) {
            console.error('Error undoing task:', error)
            router.refresh()
        }
    }

    if (groups.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-gray-400">No upcoming tasks 🎉</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {groups.map((group) => (
                <div key={group.key}>
                    {/* Day Heading */}
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {group.label}
                    </h3>
                    
                    {/* Tasks for this day */}
                    <div className="space-y-2">
                        {group.tasks.map((task) => {
                            // Format due date and time in readable format
                            let dueDateStr: string | null = null
                            let dueTimeStr: string | null = null
                            
                            if (task.due_at) {
                                dueDateStr = formatDateReadable(task.due_at)
                                const time24 = formatTimeISO(task.due_at)
                                if (time24 && time24 !== '00:00') {
                                    dueTimeStr = formatTime12Hour(task.due_at)
                                }
                            } else if (task.due_date) {
                                // Parse due_date string to Date for formatting
                                const dateObj = new Date(task.due_date + 'T00:00:00Z')
                                dueDateStr = formatDateReadable(dateObj)
                            }
                            
                            const createdDateStr = formatDateReadable(task.created_at)
                            
                            return (
                                <div
                                    key={task.id}
                                    className="bg-[#111] border border-[#262626] rounded-xl p-3 flex items-start justify-between gap-3 hover:border-[#404040] transition-colors"
                                >
                                    {/* Left: Title + Metadata */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-gray-100 break-words mb-1">
                                            {task.title}
                                        </h4>
                                        <div className="flex flex-col gap-0.5 text-xs text-gray-400">
                                            {dueDateStr && (
                                                <div>
                                                    {dueDateStr}{dueTimeStr ? ` · ${dueTimeStr}` : ''}
                                                </div>
                                            )}
                                            <div>
                                                Created: {createdDateStr}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Right: Done button */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <button
                                            onClick={() => handleDone(task.id)}
                                            disabled={completingIds.has(task.id)}
                                            className="px-3 py-1.5 text-xs font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {completingIds.has(task.id) ? '...' : 'Done'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}

            {/* Undo Toast */}
            {undoState && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-[#1f1f1f] border border-[#262626] rounded-lg px-4 py-3 shadow-lg z-50 flex items-center gap-3" style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                    <span className="text-sm text-gray-100">Task completed.</span>
                    <button
                        onClick={handleUndo}
                        className="text-sm font-medium text-[#f5f5f5] hover:text-gray-100 underline"
                    >
                        Undo
                    </button>
                </div>
            )}
        </div>
    )
}


