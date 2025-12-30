'use client'

import { formatTimeForChip } from '@/lib/time-utils'
import { formatTimeBadge, isAllDayTask } from '@/lib/datetime-utils'

interface TaskChipProps {
    title: string
    status: 'pending' | 'completed'
    startTime?: string | null
    dueAt?: string | null
    onClick?: () => void
}

export default function TaskChip({ title, status, startTime, dueAt, onClick }: TaskChipProps) {
    const statusColors = {
        pending: 'bg-[#1f1f1f] text-[#e5e5e5] border-[#262626]',
        completed: 'bg-[#1f1f1f] text-[#e5e5e5] border-[#262626]'
    }

    // Prefer due_at for time badge, fallback to startTime
    const timeBadge = dueAt ? formatTimeBadge(dueAt) : (startTime || 'All day')
    const isAllDay = dueAt ? isAllDayTask(dueAt) : !startTime
    
    // Show time badge only if not all-day
    const timePrefix = !isAllDay && timeBadge !== 'All day' ? timeBadge : null
    const displayText = timePrefix ? `${timePrefix} • ${title}` : title
    const truncatedTitle = displayText.length > 20 ? displayText.substring(0, 20) + '...' : displayText

    return (
        <div
            onClick={onClick}
            title={displayText}
            className={`
        px-2 py-1 rounded-full text-xs font-medium border
        cursor-pointer transition-all hover:shadow-sm
        ${statusColors[status]}
      `}
        >
            {truncatedTitle}
        </div>
    )
}
