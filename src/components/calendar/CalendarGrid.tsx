'use client'

import { useState, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core'
import { getMonthDays, getMonthName, getPreviousMonth, getNextMonth, groupTasksByDate } from '@/lib/calendar-utils'
import { sortTasksByDueAt, formatTimeBadge, extractTimeFromDueAt } from '@/lib/datetime-utils'
import TaskChip from './TaskChip'
import DayPanel from './DayPanel'
import { updateTaskDate } from '@/app/dashboard/calendar-actions'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_date: string | null
    due_at: string | null
    start_time: string | null
    end_time: string | null
    created_at: string
}

interface CalendarGridProps {
    tasks: Task[]
}

export default function CalendarGrid({ tasks }: CalendarGridProps) {
    const today = new Date()
    const [currentYear, setCurrentYear] = useState(today.getFullYear())
    const [currentMonth, setCurrentMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [activeTask, setActiveTask] = useState<Task | null>(null)

    const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth])
    const tasksByDate = useMemo(() => groupTasksByDate(tasks), [tasks])

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

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
    }

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id)
        if (task) {
            setActiveTask(task)
        }
    }

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event
        setActiveTask(null)

        if (!over || active.id === over.id) return

        // Extract date from droppable ID (format: "day-YYYY-MM-DD")
        const newDateKey = over.id.toString().replace('day-', '')
        const taskId = active.id.toString()

        // Find the task to preserve its time
        const task = tasks.find(t => t.id === taskId)
        if (task) {
            const { extractTimeFromDueAt, isAllDayTask } = await import('@/lib/datetime-utils')
            const currentTime = task.due_at ? extractTimeFromDueAt(task.due_at) : (task.start_time || null)
            const isAllDay = (task.due_at ? isAllDayTask(task.due_at) : !task.start_time) || false

            // Update task date (preserve time if it exists)
            await updateTaskDate(taskId, newDateKey, currentTime, isAllDay)
        }
        window.location.reload() // Refresh to show updated task
    }

    const selectedDateTasks = selectedDate
        ? (tasksByDate.get(selectedDate.toISOString().split('T')[0]) || []).map(task => ({
            ...task,
            due_at: task.due_at || null
        }))
        : []

    // Prepare agenda data for mobile view
    const agendaDates = useMemo(() => {
        const dates = Array.from(tasksByDate.keys()).sort()
        const today = new Date().toISOString().split('T')[0]
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
        
        return dates.map(dateKey => {
            const date = new Date(dateKey + 'T00:00:00')
            const tasks = sortTasksByDueAt(tasksByDate.get(dateKey) || [])
            let label = dateKey
            if (dateKey === today) label = 'Today'
            else if (dateKey === tomorrow) label = 'Tomorrow'
            else {
                const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                label = `${dayName}, ${monthDay}`
            }
            return { dateKey, label, date, tasks }
        })
    }, [tasksByDate])

    return (
        <>
            {/* Mobile Agenda View */}
            <div className="block md:hidden space-y-4">
                {agendaDates.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-sm text-gray-400">No tasks scheduled</p>
                    </div>
                ) : (
                    agendaDates.map(({ dateKey, label, tasks }) => (
                        <div key={dateKey} className="bg-[#111] border border-[#262626] rounded-2xl p-4">
                            <h3 className="text-sm font-semibold text-[#f5f5f5] mb-3">{label}</h3>
                            <div className="space-y-2">
                                {tasks.map(task => {
                                    const taskTime = task.due_at
                                        ? extractTimeFromDueAt(task.due_at)
                                        : task.start_time
                                    return (
                                        <div
                                            key={task.id}
                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-[#161616] transition-colors"
                                        >
                                            <div className="flex-shrink-0 w-16 text-xs text-[#737373] font-medium pt-0.5">
                                                {taskTime || '—'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-[#f5f5f5] break-words line-clamp-2">
                                                    {task.title}
                                                </div>
                                                {task.description && (
                                                    <div className="text-xs text-[#a3a3a3] mt-1 break-words line-clamp-1">
                                                        {task.description}
                                                    </div>
                                                )}
                                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-[#1f1f1f] text-[#e5e5e5] border border-[#262626]">
                                                    {task.status}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Calendar Grid */}
            <div className="hidden md:block">
                <DndContext
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="bg-[#111] border border-[#262626] rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-[#262626] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-gray-100">
                                {getMonthName(currentMonth)} {currentYear}
                            </h2>
                            <button
                                onClick={handleToday}
                                className="px-3 py-1.5 text-sm font-medium text-[#f5f5f5] hover:bg-[#161616] rounded-lg transition-colors"
                            >
                                Today
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                aria-label="Previous month"
                            >
                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button
                                type="button"
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
                                // Sort: timed tasks first (by time), then all-day
                                const sortedDayTasks = sortTasksByDueAt(dayTasks)
                                const visibleTasks = sortedDayTasks.slice(0, 2)
                                const remainingCount = sortedDayTasks.length - 2

                                return (
                                    <DroppableDay
                                        key={index}
                                        id={`day-${day.dateKey}`}
                                        date={day.date}
                                        isCurrentMonth={day.isCurrentMonth}
                                        isToday={day.isToday}
                                        onClick={() => handleDayClick(day.date)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span
                                                className={`
                          text-sm font-medium
                          ${day.isCurrentMonth ? 'text-gray-100' : 'text-gray-500'}
                          ${day.isToday ? 'text-[#f5f5f5] font-bold' : ''}
                        `}
                                            >
                                                {day.date.getDate()}
                                            </span>
                                        </div>

                                        {/* Task chips */}
                                        <div className="space-y-1">
                                            {visibleTasks.map(task => {
                                                // Get time from due_at or fallback to start_time
                                                const taskTime = task.due_at
                                                    ? extractTimeFromDueAt(task.due_at)
                                                    : task.start_time
                                                return (
                                                    <DraggableTask
                                                        key={task.id}
                                                        task={task}
                                                        time={taskTime}
                                                        dueAt={task.due_at}
                                                    />
                                                )
                                            })}
                                            {remainingCount > 0 && (
                                                <div className="text-xs text-gray-500 font-medium px-2">
                                                    +{remainingCount} more
                                                </div>
                                            )}
                                        </div>
                                    </DroppableDay>
                                )
                            })}
                        </div>
                        </div>
                    </div>

                    {/* Drag Overlay */}
                    <DragOverlay>
                        {activeTask && (
                            <div className="opacity-80">
                                <TaskChip
                                    title={activeTask.title}
                                    status={activeTask.status}
                                    startTime={activeTask.due_at ? extractTimeFromDueAt(activeTask.due_at) : activeTask.start_time}
                                    dueAt={activeTask.due_at}
                                />
                            </div>
                        )}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Day Panel with Timeline View */}
            <DayPanel
                selectedDate={selectedDate}
                tasks={selectedDateTasks.map(task => ({
                    ...task,
                    due_at: task.due_at || null
                }))}
                onClose={() => setSelectedDate(null)}
            />
        </>
    )
}

// Droppable Day Cell Component
function DroppableDay({
    id,
    date,
    isCurrentMonth,
    isToday,
    onClick,
    children
}: {
    id: string
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    const { setNodeRef, isOver } = useDroppable({ id })

    return (
        <div
            ref={setNodeRef}
            onClick={onClick}
            className={`
        min-h-[100px] p-2 rounded-lg border transition-all
        ${isCurrentMonth ? 'bg-[#111] border-[#262626]' : 'bg-[#0b0b0b] border-[#1a1a1a]'}
        ${isToday ? 'ring-2 ring-[#a3a3a3] bg-[#161616]' : ''}
        ${isOver ? 'ring-2 ring-[#737373] bg-[#1f1f1f]' : ''}
        hover:shadow-md hover:border-[#404040] cursor-pointer
      `}
        >
            {children}
        </div>
    )
}

// Draggable Task Component
function DraggableTask({ task, time, dueAt }: { task: Task; time?: string | null; dueAt?: string | null }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: task.id
    })

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`${isDragging ? 'opacity-50' : ''}`}
        >
            <TaskChip
                title={task.title}
                status={task.status}
                startTime={time || task.start_time}
                dueAt={dueAt || task.due_at}
            />
        </div>
    )
}
