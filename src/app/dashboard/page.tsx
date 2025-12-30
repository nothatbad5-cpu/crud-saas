import { createClient } from '@/lib/supabase/server'
import { getUsageStats, seedSampleTasks } from '@/lib/usage'
import OnboardingModal from '@/components/OnboardingModal'
import DashboardClient from '@/components/DashboardClient'
import { redirect } from 'next/navigation'
import { formatDayLabel, getDateKey } from '@/lib/date-format'

export default async function DashboardPage(props: { searchParams: { error?: string } }) {
    try {
        const searchParams = props.searchParams
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

        // Get all tasks
        const { data: allTasks, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (tasksError) {
            console.error('Failed to fetch tasks:', tasksError)
            // Continue with empty tasks array
        }

        // Filter and group upcoming tasks (pending, with due date today or later)
        const now = new Date()
        now.setUTCHours(0, 0, 0, 0)
        const todayKey = getDateKey(now)

        const upcomingTasks = (allTasks || []).filter(task => {
            // Only pending tasks
            if (task.status !== 'pending') return false
            
            // Must have a due date
            let taskDateKey: string | null = null
            if (task.due_at) {
                taskDateKey = getDateKey(task.due_at)
            } else if (task.due_date) {
                taskDateKey = task.due_date
            }
            
            if (!taskDateKey) return false
            
            // Due date must be today or later
            return taskDateKey >= todayKey
        })

        // Group tasks by date
        const groupsMap = new Map<string, typeof upcomingTasks>()
        for (const task of upcomingTasks) {
            let dateKey: string
            if (task.due_at) {
                dateKey = getDateKey(task.due_at)
            } else if (task.due_date) {
                dateKey = task.due_date
            } else {
                continue
            }
            
            if (!groupsMap.has(dateKey)) {
                groupsMap.set(dateKey, [])
            }
            groupsMap.get(dateKey)!.push(task)
        }

        // Convert to sorted array of groups
        const taskGroups = Array.from(groupsMap.entries())
            .map(([key, tasks]) => ({
                key,
                label: formatDayLabel(key),
                tasks: tasks.sort((a, b) => {
                    // Sort by time if available, else by title
                    const timeA = a.due_at ? new Date(a.due_at).getTime() : 0
                    const timeB = b.due_at ? new Date(b.due_at).getTime() : 0
                    if (timeA !== timeB) return timeA - timeB
                    return a.title.localeCompare(b.title)
                })
            }))
            .sort((a, b) => a.key.localeCompare(b.key)) // Sort groups by date

        // Keep all tasks for calendar view, but pass grouped upcoming for table view
        const tasks = allTasks || []

        return (
            <div>
                <OnboardingModal isOpen={!stats.hasSeenOnboarding} />
                <DashboardClient
                    tasks={tasks}
                    upcomingGroups={taskGroups}
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
