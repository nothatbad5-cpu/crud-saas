import Navbar from '@/components/Navbar'
import { getUsageStats } from '@/lib/usage'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            redirect('/login')
        }

        const stats = await getUsageStats(user.id)

        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 relative">
                <Navbar />
                <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                    <DashboardLayoutClient stats={stats}>
                        {children}
                    </DashboardLayoutClient>
                </main>
            </div>
        )
    } catch (error) {
        console.error('DashboardLayout error:', error)
        try {
            const fs = require('fs')
            fs.appendFileSync('layout-error.log', `[${new Date().toISOString()}] ${error instanceof Error ? error.stack : String(error)}\n`)
        } catch (e) { }
        throw error // Re-throw to show error page
    }
}
