'use client'

import { useState } from 'react'
import DayTimelineView from './DayTimelineView'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_date: string | null
    due_at: string | null
    start_time: string | null
    end_time: string | null
}

interface DayPanelProps {
    selectedDate: Date | null
    tasks: Task[]
    onClose: () => void
}

export default function DayPanel({ selectedDate, tasks, onClose }: DayPanelProps) {
    if (!selectedDate) return null

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/30 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Panel with Timeline View */}
            <div className="fixed top-0 right-0 h-full w-[600px] max-w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors z-10"
                    aria-label="Close panel"
                >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Timeline View */}
                <DayTimelineView selectedDate={selectedDate} tasks={tasks} />
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
