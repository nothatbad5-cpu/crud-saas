import Navbar from '@/components/Navbar'
import { getUsageStats } from '@/lib/usage'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from '@/components/DashboardLayoutClient'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const stats = await getUsageStats(user.id)

    return (
        <div className="min-h-screen bg-gray-100 relative">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <DashboardLayoutClient stats={stats}>
                    {children}
                </DashboardLayoutClient>
            </main>
        </div>
    )
}
