'use client'

import { useState, useEffect } from 'react'

type View = 'table' | 'calendar'

interface ViewToggleProps {
    currentView: View
    onViewChange: (view: View) => void
}

export default function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
    return (
        <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
                onClick={() => onViewChange('table')}
                className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'table'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }
        `}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Table
                </div>
            </button>
            <button
                onClick={() => onViewChange('calendar')}
                className={`
          px-4 py-2 rounded-md text-sm font-medium transition-all
          ${currentView === 'calendar'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }
        `}
            >
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Calendar
                </div>
            </button>
        </div>
    )
}
