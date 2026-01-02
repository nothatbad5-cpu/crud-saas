import { createClient } from '@/lib/supabase/server'
import { getUsageStats, seedSampleTasks } from '@/lib/usage'
import OnboardingModal from '@/components/OnboardingModal'
import DashboardClient from '@/components/DashboardClient'
import { redirect } from 'next/navigation'
import { dayLabel, startOfDayKey, formatDateISO } from '@/lib/date'
import { analyzeCompletedTasks } from '@/lib/ai-suggestions'

export default async function DashboardPage(props: { searchParams: { error?: string } }) {
    try {
        const searchParams = props.searchParams
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        // STRICT AUTH: Must have authenticated user
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

        // Get all tasks - filter by user_id ONLY
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
        const todayKey = startOfDayKey(now)

        const upcomingTasks = (allTasks || []).filter(task => {
            // Only pending tasks (normalize status to lowercase)
            const status = (task.status || '').toLowerCase()
            if (status !== 'pending') return false
            
            // Include ALL pending tasks:
            // - Tasks with due_at IS NULL (no date)
            // - Tasks with due_at >= startOfToday
            let taskDateKey: string | null = null
            if (task.due_at) {
                taskDateKey = startOfDayKey(task.due_at)
            } else if (task.due_date) {
                taskDateKey = task.due_date
            }
            
            // If no due date, include it (will be grouped under "No date")
            if (!taskDateKey) return true
            
            // Due date must be today or later
            return taskDateKey >= todayKey
        })

        // Group tasks by date (including "No date" group)
        const groupsMap = new Map<string, typeof upcomingTasks>()
        for (const task of upcomingTasks) {
            let dateKey: string
            if (task.due_at) {
                dateKey = startOfDayKey(task.due_at)
            } else if (task.due_date) {
                dateKey = task.due_date
            } else {
                // No due date - group under "No date"
                dateKey = '__no_date__'
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
                label: key === '__no_date__' ? 'No date' : dayLabel(key),
                tasks: tasks.sort((a, b) => {
                    // Sort by time if available, else by title
                    const timeA = a.due_at ? new Date(a.due_at).getTime() : 0
                    const timeB = b.due_at ? new Date(b.due_at).getTime() : 0
                    if (timeA !== timeB) return timeA - timeB
                    return a.title.localeCompare(b.title)
                })
            }))
            .sort((a, b) => {
                // "No date" group goes last
                if (a.key === '__no_date__') return 1
                if (b.key === '__no_date__') return -1
                return a.key.localeCompare(b.key)
            })

        // Get completed tasks sorted by updated_at (when they were completed) or created_at desc
        const completedTasks = (allTasks || [])
            .filter(task => task.status === 'completed')
            .sort((a, b) => {
                // Sort by updated_at if available (when completed), else created_at
                const aDate = a.updated_at || a.created_at
                const bDate = b.updated_at || b.created_at
                return new Date(bDate).getTime() - new Date(aDate).getTime() // Most recent first
            })

        // Analyze completed tasks for AI suggestions
        const aiSuggestions = analyzeCompletedTasks(completedTasks.map(t => ({
            title: t.title,
            updated_at: t.updated_at,
            created_at: t.created_at
        })))

        // Keep all tasks for calendar view, but pass grouped upcoming for table view
        const tasks = allTasks || []

        return (
            <div>
                <OnboardingModal isOpen={!stats.hasSeenOnboarding} />
                <DashboardClient
                    tasks={tasks}
                    upcomingGroups={taskGroups}
                    completedTasks={completedTasks}
                    aiSuggestions={aiSuggestions}
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
