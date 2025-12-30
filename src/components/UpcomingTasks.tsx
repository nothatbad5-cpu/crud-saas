'use client'

import { useState } from 'react'
import { toggleTaskStatus } from '@/app/dashboard/calendar-actions'
import { formatDayLabel, formatTimeHHMM } from '@/lib/date-format'
import { useRouter } from 'next/navigation'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_at: string | null
    due_date: string | null
}

interface TaskGroup {
    key: string
    label: string
    tasks: Task[]
}

interface UpcomingTasksProps {
    groups: TaskGroup[]
}

export default function UpcomingTasks({ groups: initialGroups }: UpcomingTasksProps) {
    const [groups, setGroups] = useState(initialGroups)
    const [completingIds, setCompletingIds] = useState<Set<string>>(new Set())
    const router = useRouter()

    const handleDone = async (taskId: string) => {
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
                setGroups(initialGroups)
                console.error('Failed to complete task:', result.error)
            } else {
                // Refresh to sync with server
                router.refresh()
            }
        } catch (error) {
            // Revert on error
            setGroups(initialGroups)
            console.error('Error completing task:', error)
        } finally {
            setCompletingIds(prev => {
                const next = new Set(prev)
                next.delete(taskId)
                return next
            })
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
                            const timeStr = task.due_at ? formatTimeHHMM(task.due_at) : null
                            const showTime = timeStr && timeStr !== '00:00'
                            
                            return (
                                <div
                                    key={task.id}
                                    className="bg-[#111] border border-[#262626] rounded-xl p-3 flex items-start justify-between gap-3 hover:border-[#404040] transition-colors"
                                >
                                    {/* Left: Title + Description */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-gray-100 break-words">
                                            {task.title}
                                        </h4>
                                        {task.description && (
                                            <p className="text-xs text-gray-400 mt-1 break-words line-clamp-1">
                                                {task.description}
                                            </p>
                                        )}
                                    </div>
                                    
                                    {/* Right: Time + Done button */}
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        {showTime && (
                                            <span className="text-xs text-gray-400 font-medium">
                                                {timeStr}
                                            </span>
                                        )}
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
        </div>
    )
}

