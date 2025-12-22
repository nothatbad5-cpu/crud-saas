'use client'

import { useState, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, useDroppable, useDraggable } from '@dnd-kit/core'
import { getMonthDays, getMonthName, getPreviousMonth, getNextMonth, groupTasksByDate } from '@/lib/calendar-utils'
import TaskChip from './TaskChip'
import DayPanel from './DayPanel'
import { updateTaskDate } from '@/app/dashboard/calendar-actions'

interface Task {
    id: string
    title: string
    description: string | null
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

        // Update task date
        await updateTaskDate(taskId, newDateKey)
        window.location.reload() // Refresh to show updated task
    }

    const selectedDateTasks = selectedDate
        ? (tasksByDate.get(selectedDate.toISOString().split('T')[0]) || [])
        : []

    return (
        <>
            <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
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
                                                <DraggableTask key={task.id} task={task} />
                                            ))}
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
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Day Panel */}
            <DayPanel
                selectedDate={selectedDate}
                tasks={selectedDateTasks}
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
        ${isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'}
        ${isToday ? 'ring-2 ring-indigo-400 bg-indigo-50' : ''}
        ${isOver ? 'ring-2 ring-green-400 bg-green-50' : ''}
        hover:shadow-md hover:border-indigo-200 cursor-pointer
      `}
        >
            {children}
        </div>
    )
}

// Draggable Task Component
function DraggableTask({ task }: { task: Task }) {
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
            />
        </div>
    )
}
