'use client'

import { useState } from 'react'
import { toggleTaskStatus } from '@/app/dashboard/calendar-actions'
import { formatDateISO, formatTimeISO } from '@/lib/date'
import { useRouter } from 'next/navigation'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_at: string | null
    due_date: string | null
    created_at: string
    updated_at: string
}

interface CompletedTasksProps {
    tasks: Task[]
}

export default function CompletedTasks({ tasks: initialTasks }: CompletedTasksProps) {
    const [tasks, setTasks] = useState(initialTasks)
    const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    const handleRestore = async (taskId: string) => {
        setRestoringIds(prev => new Set(prev).add(taskId))

        try {
            // Toggle status back to pending
            const result = await toggleTaskStatus(taskId)
            
            if (result.error) {
                console.error('Failed to restore task:', result.error)
            } else {
                // Remove from list optimistically
                setTasks(prev => prev.filter(t => t.id !== taskId))
                router.refresh()
            }
        } catch (error) {
            console.error('Error restoring task:', error)
        } finally {
            setRestoringIds(prev => {
                const next = new Set(prev)
                next.delete(taskId)
                return next
            })
        }
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-sm text-gray-400">No completed tasks</p>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {tasks.map((task) => {
                // Format dates
                const completedDateStr = formatDateISO(task.updated_at)
                const createdDateStr = formatDateISO(task.created_at)
                
                let dueDateStr: string | null = null
                let dueTimeStr: string | null = null
                
                if (task.due_at) {
                    dueDateStr = formatDateISO(task.due_at)
                    dueTimeStr = formatTimeISO(task.due_at)
                    if (dueTimeStr === '00:00') {
                        dueTimeStr = null
                    }
                } else if (task.due_date) {
                    dueDateStr = task.due_date
                }
                
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
                                <div>
                                    Completed: {completedDateStr}
                                </div>
                                <div>
                                    Created: {createdDateStr}
                                </div>
                                {dueDateStr && (
                                    <div>
                                        Due: {dueDateStr}{dueTimeStr ? ` at ${dueTimeStr}` : ''}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Right: Restore button */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <button
                                onClick={() => handleRestore(task.id)}
                                disabled={restoringIds.has(task.id)}
                                className="px-3 py-1.5 text-xs font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {restoringIds.has(task.id) ? '...' : 'Restore'}
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

