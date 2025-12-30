'use client'

import { useState } from 'react'
import UpcomingTasks from '@/components/UpcomingTasks'
import CalendarGrid from '@/components/calendar/CalendarGrid'
import ViewToggle from '@/components/ViewToggle'
import CreateTaskModal from '@/components/modals/CreateTaskModal'
import AICommandBar from '@/components/AICommandBar'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useRouter } from 'next/navigation'

interface TaskGroup {
    key: string
    label: string
    tasks: any[]
}

interface DashboardClientProps {
    tasks: any[]
    upcomingGroups: TaskGroup[]
    stats: any
    error?: string
}

export default function DashboardClient({ tasks, upcomingGroups, stats, error }: DashboardClientProps) {
    const [view, setView] = useState<'table' | 'calendar'>('table')
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const router = useRouter()

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
        <div className="w-full min-h-full relative" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 140px)' }}>
            {/* Error Banner */}
            {error && (
                <div className="bg-[#1f1f1f] border-l-4 border-[#262626] p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-[#f5f5f5]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-[#f5f5f5]">{typeof error === 'string' ? error : String(error || '')}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Command Bar */}
            <AICommandBar onSuccess={() => router.refresh()} />

            {/* Header with View Toggle - Mobile Stacked */}
            <div className="mb-3 md:mb-6">
                {/* Title */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-7 text-gray-100 mb-2 md:mb-4 md:mb-0">
                    Dashboard
                </h2>
                {/* Mobile: Stacked layout */}
                <div className="md:hidden space-y-2">
                    <ViewToggle currentView={view} onViewChange={setView} />
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="w-full h-10 inline-flex items-center justify-center px-4 border border-transparent rounded-md text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                    >
                        New Task
                    </button>
                </div>
                {/* Desktop: Horizontal layout */}
                <div className="hidden md:flex md:items-center md:justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-4">
                        <ViewToggle currentView={view} onViewChange={setView} />
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Usage Indicator for Free Users */}
                        {!stats.isPro && (
                            <div className="text-sm text-gray-400">
                                <span className="font-medium text-gray-100">{stats.tasksCount}</span> / {stats.limit} tasks
                            </div>
                        )}

                        <a
                            href="/pricing"
                            className={`font-medium text-[#f5f5f5] hover:opacity-80 ${!stats.isPro && stats.tasksCount >= stats.limit ? 'font-bold' : ''}`}
                        >
                            {stats.isPro ? 'Manage Subscription' : 'Upgrade to Pro'}
                        </a>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                        >
                            New Task
                        </button>
                    </div>
                </div>
            </div>

            {/* Conditional View Rendering */}
            {view === 'table' ? (
                <UpcomingTasks groups={upcomingGroups} />
            ) : (
                <CalendarGrid tasks={tasks} />
            )}

            {/* Create Task Modal */}
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />

            {/* Keyboard Shortcuts Hint - Hidden on mobile, fixed position to not block scroll */}
            <div className="hidden md:block fixed bottom-4 left-4 bg-[#111]/90 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 text-xs text-gray-400 border border-[#262626] z-30 pointer-events-auto" style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
                <span className="font-semibold">Shortcuts:</span> <kbd className="px-1.5 py-0.5 bg-[#1f1f1f] border border-[#262626] rounded">N</kbd> New Task · <kbd className="px-1.5 py-0.5 bg-[#1f1f1f] border border-[#262626] rounded">T</kbd> Toggle View
            </div>
        </div>
    )
}
