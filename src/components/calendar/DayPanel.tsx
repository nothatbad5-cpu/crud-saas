'use client'

import { useState } from 'react'
import { createTaskWithDate, toggleTaskStatus } from '@/app/dashboard/calendar-actions'
import { deleteTask } from '@/app/dashboard/actions'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_date: string | null
}

interface DayPanelProps {
    selectedDate: Date | null
    tasks: Task[]
    onClose: () => void
}

export default function DayPanel({ selectedDate, tasks, onClose }: DayPanelProps) {
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    if (!selectedDate) return null

    const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    })

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTaskTitle.trim()) return

        setIsCreating(true)
        const formData = new FormData()
        formData.append('title', newTaskTitle)
        formData.append('description', '')
        formData.append('due_date', selectedDate.toISOString().split('T')[0])
        formData.append('status', 'pending')

        const result = await createTaskWithDate(formData)

        if (result?.error) {
            alert(result.error)
        } else {
            setNewTaskTitle('')
            window.location.reload() // Refresh to show new task
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

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">{dateStr}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close panel"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Task List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                    {tasks.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="mt-2 text-sm text-gray-500">No tasks for this day</p>
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div
                                key={task.id}
                                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-indigo-200 transition-colors"
                            >
                                <div className="flex items-start gap-3">
                                    {/* Checkbox */}
                                    <input
                                        type="checkbox"
                                        checked={task.status === 'completed'}
                                        onChange={() => handleToggleStatus(task.id)}
                                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                                    />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className="mt-1 text-xs text-gray-500">{task.description}</p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <a
                                            href={`/dashboard/${task.id}/edit`}
                                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </a>
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-1 hover:bg-red-100 rounded transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Quick Add Form */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <form onSubmit={handleCreateTask} className="flex gap-2">
                        <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Add a task for this day..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            disabled={isCreating}
                        />
                        <button
                            type="submit"
                            disabled={isCreating || !newTaskTitle.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isCreating ? 'Adding...' : 'Add'}
                        </button>
                    </form>
                </div>
            </div>

            <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
        </>
    )
}
