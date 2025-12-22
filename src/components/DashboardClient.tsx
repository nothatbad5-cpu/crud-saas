'use client'

import { useState } from 'react'
import TaskTable from '@/components/TaskTable'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import ViewToggle from '@/components/ViewToggle'
import CreateTaskModal from '@/components/modals/CreateTaskModal'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

interface DashboardClientProps {
    tasks: any[]
    stats: any
    error?: string
}

export default function DashboardClient({ tasks, stats, error }: DashboardClientProps) {
    const [view, setView] = useState<'table' | 'calendar'>('table')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'n',
            handler: () => setIsCreateModalOpen(true),
            description: 'New Task'
        },
        {
            key: 't',
            handler: () => setView(v => v === 'table' ? 'calendar' : 'table'),
            description: 'Toggle View'
        }
    ])

    return (
        <div>
            {/* Error Banner */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Header with View Toggle */}
            <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0 flex items-center gap-4">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                        Dashboard
                    </h2>
                    <ViewToggle currentView={view} onViewChange={setView} />
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 items-center space-x-4">
                    {/* Usage Indicator for Free Users */}
                    {!stats.isPro && (
                        <div className="text-sm text-gray-500 hidden sm:block">
                            <span className="font-medium text-gray-900">{stats.tasksCount}</span> / {stats.limit} tasks
                        </div>
                    )}

                    <a
                        href="/pricing"
                        className={`mr-3 font-medium ${!stats.isPro && stats.tasksCount >= stats.limit ? 'text-indigo-700 font-bold' : 'text-indigo-600 hover:text-indigo-900'}`}
                    >
                        {stats.isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                    </a>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        New Task
                    </button>
                </div>
            </div>

            {/* Conditional View Rendering */}
            {view === 'table' ? (
                <>
                    {/* Empty State for Table View */}
                    {(!tasks || tasks.length === 0) ? (
                        <div className="text-center py-12">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                            </svg>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks (yet!)</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new task.</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                    </svg>
                                    Create Task
                                </button>
                            </div>
                        </div>
                    ) : (
                        <TaskTable tasks={tasks} />
                    )}
                </>
            ) : (
                <CalendarGrid tasks={tasks} />
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Keyboard Shortcuts Hint */}
            <div className="fixed bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 border border-gray-200">
                <span className="font-semibold">Shortcuts:</span> <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">N</kbd> New Task · <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded">T</kbd> Toggle View
            </div>
        </div>
    )
}
