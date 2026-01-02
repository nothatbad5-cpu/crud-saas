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

        // Filter upcoming tasks - ONLY filter by status, NEVER by date
        // ALL pending tasks must appear in Upcoming, including overdue tasks
        const now = new Date()
        const todayKey = startOfDayKey(now)
        
        // Calculate tomorrow key for grouping
        const tomorrow = new Date(now)
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
        const tomorrowKey = startOfDayKey(tomorrow)

        // CRITICAL: Filter ONLY by status === 'pending'
        // Do NOT exclude tasks based on date comparisons
        // ALL pending tasks must appear, including overdue ones
        const upcomingTasks = (allTasks || []).filter(task => {
            const status = (task.status || '').toLowerCase()
            return status === 'pending'
        })

        // Group tasks AFTER filtering by status only
        // Each date gets its own group, labeled as: Overdue, Today, Tomorrow, or date label
        // Tasks with due_at = null are grouped under Today
        const groupsMap = new Map<string, typeof upcomingTasks>()
        
        for (const task of upcomingTasks) {
            let dateKey: string
            if (task.due_at) {
                dateKey = startOfDayKey(task.due_at)
            } else if (task.due_date) {
                dateKey = task.due_date
            } else {
                // CRITICAL: Tasks with no due_at and no due_date are treated as TODAY
                // This ensures AI-created tasks (often with due_at = null) appear immediately
                dateKey = todayKey
            }
            
            // Use dateKey as the grouping key (YYYY-MM-DD format)
            // Labels will be assigned during conversion based on date comparison
            if (!groupsMap.has(dateKey)) {
                groupsMap.set(dateKey, [])
            }
            groupsMap.get(dateKey)!.push(task)
        }

        // Convert to sorted array of groups with proper labels
        // Labels: Overdue (for dates < today), Today, Tomorrow, or dayLabel for future dates
        const taskGroups = Array.from(groupsMap.entries())
            .map(([dateKey, tasks]) => {
                // Determine label based on date comparison
                let label: string
                if (dateKey < todayKey) {
                    label = 'Overdue'
                } else if (dateKey === todayKey) {
                    label = 'Today'
                } else if (dateKey === tomorrowKey) {
                    label = 'Tomorrow'
                } else {
                    // Future dates use dayLabel (returns "Day after tomorrow" or YYYY-MM-DD)
                    label = dayLabel(dateKey)
                }
                
                return {
                    key: dateKey, // Keep dateKey for sorting
                    label, // Use computed label for display
                    tasks: tasks.sort((a, b) => {
                        // Sort by time if available, else by title
                        const timeA = a.due_at ? new Date(a.due_at).getTime() : 0
                        const timeB = b.due_at ? new Date(b.due_at).getTime() : 0
                        if (timeA !== timeB) return timeA - timeB
                        return a.title.localeCompare(b.title)
                    })
                }
            })
            .sort((a, b) => {
                // Sort by date key (YYYY-MM-DD string comparison works correctly)
                // This ensures: Overdue dates first (oldest first), then Today, Tomorrow, then future dates
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
