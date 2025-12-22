'use client'

import { formatTimeForChip } from '@/lib/time-utils'

interface TaskChipProps {
    title: string
    status: 'pending' | 'completed'
    startTime?: string | null
    onClick?: () => void
}

export default function TaskChip({ title, status, startTime, onClick }: TaskChipProps) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        completed: 'bg-green-100 text-green-800 border-green-200'
    }

    const timePrefix = formatTimeForChip(startTime || null)
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
