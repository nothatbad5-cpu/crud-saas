'use client'

interface TaskChipProps {
    title: string
    status: 'pending' | 'completed'
    onClick?: () => void
}

export default function TaskChip({ title, status, onClick }: TaskChipProps) {
    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        completed: 'bg-green-100 text-green-800 border-green-200'
    }

    const truncatedTitle = title.length > 20 ? title.substring(0, 20) + '...' : title

    return (
        <div
            onClick={onClick}
            title={title}
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
