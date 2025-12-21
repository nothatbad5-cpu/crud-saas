import { createClient } from '@/lib/supabase/server'
import { getUsageStats, seedSampleTasks } from '@/lib/usage'
import OnboardingModal from '@/components/OnboardingModal'
import DashboardClient from '@/components/DashboardClient'
import { redirect } from 'next/navigation'

export default async function DashboardPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Phase 3: Seed logic (Idempotent)
    await seedSampleTasks(user.id)

    // Phase 3: Get Usage Stats
    const stats = await getUsageStats(user.id)

    const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div>
            <OnboardingModal isOpen={!stats.hasSeenOnboarding} />
            <DashboardClient
                tasks={tasks || []}
                stats={stats}
                error={searchParams.error}
            />
        </div>
    )
}
