import { createClient } from '@/lib/supabase/server'
import { getUsageStats, seedSampleTasks } from '@/lib/usage'
import OnboardingModal from '@/components/OnboardingModal'
import DashboardClient from '@/components/DashboardClient'
import { redirect } from 'next/navigation'

export default async function DashboardPage(props: { searchParams: Promise<{ error?: string }> }) {
    try {
        const searchParams = await props.searchParams
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            redirect('/login')
        }

        // Phase 3: Seed logic (Idempotent) - non-critical, continue on error
        try {
            await seedSampleTasks(user.id)
        } catch (error) {
            console.error('Failed to seed sample tasks:', error)
            // Continue - non-critical operation
        }

        // Phase 3: Get Usage Stats
        let stats
        try {
            stats = await getUsageStats(user.id)
        } catch (error) {
            console.error('Failed to get usage stats:', error)
            // Provide default stats on error
            stats = {
                tasksCount: 0,
                limit: 5,
                isPro: false,
                isSampleSeeded: false,
                hasSeenOnboarding: false,
            }
        }

        // Get tasks
        const { data: tasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .order('created_at', { ascending: false })

        if (tasksError) {
            console.error('Failed to fetch tasks:', tasksError)
            // Continue with empty tasks array
        }

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
    } catch (error) {
        console.error('Dashboard page error:', error)
        try {
            const fs = require('fs')
            fs.appendFileSync('server-error.log', `[${new Date().toISOString()}] ${error instanceof Error ? error.stack : String(error)}\n`)
        } catch (e) {
            // ignore fs errors
        }
        redirect('/dashboard?error=' + encodeURIComponent('Failed to load dashboard. Please try again.'))
    }
}
