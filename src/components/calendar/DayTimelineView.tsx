'use client'

import { useState, useMemo } from 'react'
import { createTaskWithDate, toggleTaskStatus } from '@/app/dashboard/calendar-actions'
import { deleteTask } from '@/app/dashboard/actions'
import { getHourFromDueAt, isAllDayTask, extractTimeFromDueAt } from '@/lib/datetime-utils'
import Link from 'next/link'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_at: string | null
    due_date: string | null
    start_time: string | null
    end_time: string | null
}

interface DayTimelineViewProps {
    selectedDate: Date
    tasks: Task[]
    onCreateTask?: (date: Date, hour?: number) => void
}

export default function DayTimelineView({ selectedDate, tasks, onCreateTask }: DayTimelineViewProps) {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [selectedHour, setSelectedHour] = useState<number | null>(null)

    // Separate all-day tasks from timed tasks
    const { allDayTasks, timedTasks } = useMemo(() => {
        const allDay: Task[] = []
        const timed: Task[] = []

        tasks.forEach(task => {
            if (task.due_at && !isAllDayTask(task.due_at)) {
                timed.push(task)
            } else {
                allDay.push(task)
            }
        })

        // Sort timed tasks by hour
        timed.sort((a, b) => {
            const hourA = getHourFromDueAt(a.due_at) ?? 24
            const hourB = getHourFromDueAt(b.due_at) ?? 24
            return hourA - hourB
        })

        return { allDayTasks: allDay, timedTasks: timed }
    }, [tasks])

    // Generate hours for timeline (6:00 AM to 10:00 PM for better UX)
    const hours = useMemo(() => {
        const h: number[] = []
        for (let i = 6; i <= 22; i++) {
            h.push(i)
        }
        return h
    }, [])

    // Group timed tasks by hour
    const tasksByHour = useMemo(() => {
        const map = new Map<number, Task[]>()
        timedTasks.forEach(task => {
            const hour = getHourFromDueAt(task.due_at)
            if (hour !== null) {
                if (!map.has(hour)) {
                    map.set(hour, [])
                }
                map.get(hour)!.push(task)
            }
        })
        return map
    }, [timedTasks])

    const handleCreateTask = async (hour?: number) => {
        // If clicking empty slot without title, just select the hour
        if (!newTaskTitle.trim() && hour !== undefined) {
            setSelectedHour(hour)
            if (onCreateTask) {
                onCreateTask(selectedDate, hour)
            }
            return
        }

        // Need title to create task
        if (!newTaskTitle.trim()) return

        setIsCreating(true)
        const formData = new FormData()
        formData.append('title', newTaskTitle.trim())
        formData.append('description', '')
        formData.append('dueDate', selectedDate.toISOString().split('T')[0])
        formData.append('status', 'pending')
        
        if (hour !== undefined || selectedHour !== null) {
            // Create task at specific hour
            const targetHour = hour !== undefined ? hour : selectedHour!
            const timeStr = `${String(targetHour).padStart(2, '0')}:00`
            formData.append('dueTime', timeStr)
            formData.append('allDay', 'false')
        } else {
            // All-day task
            formData.append('allDay', 'true')
        }

        const result = await createTaskWithDate(formData)

        if (result?.error) {
            alert(result.error)
        } else {
            setNewTaskTitle('')
            setSelectedHour(null)
            window.location.reload()
        }
        setIsCreating(false)
    }

    const handleToggleStatus = async (taskId: string) => {
        await toggleTaskStatus(taskId)
        window.location.reload()
    }

    const handleDelete = async (taskId: string) => {
        if (confirm('Delete this task?')) {
            await deleteTask(taskId)
            window.location.reload()
        }
    }

    const formatHour = (hour: number): string => {
        if (hour === 0) return '12 AM'
        if (hour < 12) return `${hour} AM`
        if (hour === 12) return '12 PM'
        return `${hour - 12} PM`
    }

    // Use deterministic formatting to prevent hydration mismatches
    const dateStr = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    }).format(selectedDate)

    return (
        <div className="h-full flex flex-col bg-[#0b0b0b]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">{dateStr}</h2>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {/* All-day tasks section */}
                {allDayTasks.length > 0 && (
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            All day
                        </h3>
                        <div className="space-y-2">
                            {allDayTasks.map(task => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    onToggle={handleToggleStatus}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Timeline */}
                <div className="px-6 py-4">
                    <div className="space-y-1">
                        {hours.map(hour => {
                            const hourTasks = tasksByHour.get(hour) || []
                            const isSelected = selectedHour === hour

                            return (
                                <div
                                    key={hour}
                                    className="flex items-start gap-4 min-h-[60px] border-b border-gray-100 last:border-0"
                                >
                                    {/* Time label */}
                                    <div className="w-16 flex-shrink-0 pt-2">
                                        <span className="text-xs font-medium text-gray-500">
                                            {formatHour(hour)}
                                        </span>
                                    </div>

                                    {/* Tasks or empty slot */}
                                    <div className="flex-1 py-2">
                                        {hourTasks.length > 0 ? (
                                            <div className="space-y-2">
                                                {hourTasks.map(task => (
                                                    <TaskCard
                                                        key={task.id}
                                                        task={task}
                                                        onToggle={handleToggleStatus}
                                                        onDelete={handleDelete}
                                                        showTime={true}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handleCreateTask(hour)}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                            >
                                                + Add task
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Add Form */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleCreateTask(selectedHour ?? undefined)
                    }}
                    className="flex gap-2"
                >
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder={selectedHour !== null ? `Add task at ${formatHour(selectedHour)}...` : 'Add all-day task...'}
                        className="flex-1 px-3 py-2 border border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] placeholder-[#737373] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0"
                        disabled={isCreating}
                    />
                    <button
                        type="submit"
                        disabled={isCreating || !newTaskTitle.trim()}
                        className="px-4 py-2 bg-[#f5f5f5] text-[#0b0b0b] rounded-lg text-sm font-medium hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isCreating ? 'Adding...' : 'Add'}
                    </button>
                    {selectedHour !== null && (
                        <button
                            type="button"
                            onClick={() => setSelectedHour(null)}
                            className="px-3 py-2 text-sm text-gray-400 hover:text-gray-100"
                        >
                            Clear
                        </button>
                    )}
                </form>
            </div>
        </div>
    )
}

// Task Card Component
function TaskCard({
    task,
    onToggle,
    onDelete,
    showTime = false
}: {
    task: Task
    onToggle: (id: string) => void
    onDelete: (id: string) => void
    showTime?: boolean
}) {
    const timeStr = task.due_at ? extractTimeFromDueAt(task.due_at) : task.start_time

    return (
        <div className="p-3 bg-[#1f1f1f] border border-[#262626] rounded-lg hover:border-[#404040] transition-colors">
            <div className="flex items-start gap-3">
                <input
                    type="checkbox"
                    checked={task.status === 'completed'}
                    onChange={() => onToggle(task.id)}
                    className="mt-1 h-4 w-4 text-[#f5f5f5] border-[#262626] bg-[#0f0f0f] rounded focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-100'}`}>
                            {task.title}
                        </h3>
                        {showTime && timeStr && (
                            <span className="text-xs text-gray-400 font-medium">
                                {timeStr}
                            </span>
                        )}
                    </div>
                    {task.description && (
                        <p className="mt-1 text-xs text-gray-400">{task.description}</p>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <Link
                        href={`/dashboard/${task.id}/edit`}
                        className="p-1 hover:bg-[#161616] rounded transition-colors"
                        title="Edit"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </Link>
                    <button
                        onClick={() => onDelete(task.id)}
                        className="p-1 hover:bg-[#161616] rounded transition-colors"
                        title="Delete"
                    >
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}

