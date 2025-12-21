'use client'

import { useState } from 'react'
import { getMonthDays, getMonthName, getPreviousMonth, getNextMonth, groupTasksByDate } from '@/lib/calendar-utils'
import TaskChip from './TaskChip'

interface Task {
    id: string
    title: string
    status: 'pending' | 'completed'
    due_date: string | null
    created_at: string
}

interface CalendarGridProps {
    tasks: Task[]
}

export default function CalendarGrid({ tasks }: CalendarGridProps) {
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())

    const days = getMonthDays(currentYear, currentMonth)
    const tasksByDate = groupTasksByDate(tasks)

    const handlePrevMonth = () => {
        const { year, month } = getPreviousMonth(currentYear, currentMonth)
        setCurrentYear(year)
        setCurrentMonth(month)
    }

    const handleNextMonth = () => {
        const { year, month } = getNextMonth(currentYear, currentMonth)
        setCurrentYear(year)
        setCurrentMonth(month)
    }

    const handleToday = () => {
        const now = new Date()
        setCurrentYear(now.getFullYear())
        setCurrentMonth(now.getMonth())
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        {getMonthName(currentMonth)} {currentYear}
                    </h2>
                    <button
                        onClick={handleToday}
                        className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Previous month"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Next month"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, index) => {
                        const dayTasks = tasksByDate.get(day.dateKey) || []
                        const visibleTasks = dayTasks.slice(0, 2)
                        const remainingCount = dayTasks.length - 2

                        return (
                            <div
                                key={index}
                                className={`
                  min-h-[100px] p-2 rounded-lg border transition-all
                  ${day.isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
                  ${day.isToday ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}
                  hover:shadow-md hover:border-indigo-200 cursor-pointer
                `}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span
                                        className={`
                      text-sm font-medium
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${day.isToday ? 'text-indigo-600 font-bold' : ''}
                    `}
                                    >
                                        {day.date.getDate()}
                                    </span>
                                </div>

                                {/* Task chips */}
                                <div className="space-y-1">
                                    {visibleTasks.map(task => (
                                        <TaskChip
                                            key={task.id}
                                            title={task.title}
                                            status={task.status}
                                        />
                                    ))}
                                    {remainingCount > 0 && (
                                        <div className="text-xs text-gray-500 font-medium px-2">
                                            +{remainingCount} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
