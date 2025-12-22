'use client'

import { useState } from 'react'
import FloatingDashboard from '@/components/FloatingDashboard'
import CreateTaskModal from '@/components/modals/CreateTaskModal'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    stats: {
        tasksCount: number
        limit: number
        isPro: boolean
    }
}

export default function DashboardLayoutClient({ children, stats }: DashboardLayoutClientProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    return (
        <>
            {children}
            <FloatingDashboard
                count={stats.tasksCount}
                limit={stats.limit === Infinity ? -1 : stats.limit}
                isPro={stats.isPro}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />
            <CreateTaskModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    )
}
