'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { combineDateTimeToISO, extractDateFromDueAt } from '@/lib/datetime-utils'

interface TaskSuggestion {
    title: string
    weekday: string
    count: number
}

interface AISuggestionsProps {
    suggestions: TaskSuggestion[]
}

export default function AISuggestions({ suggestions: initialSuggestions }: AISuggestionsProps) {
    const [suggestions, setSuggestions] = useState(initialSuggestions)
    const [dismissed, setDismissed] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState<string | null>(null)
    const router = useRouter()

    // Load dismissed suggestions from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('ai-suggestions-dismissed')
        if (stored) {
            try {
                const dismissedList = JSON.parse(stored) as string[]
                setDismissed(new Set(dismissedList))
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [])

    // Filter out dismissed suggestions
    const visibleSuggestions = suggestions.filter(s => {
        const key = `${s.title}|${s.weekday}`
        return !dismissed.has(key)
    })

    const handleDismiss = (suggestion: TaskSuggestion) => {
        const key = `${suggestion.title}|${suggestion.weekday}`
        const newDismissed = new Set(dismissed).add(key)
        setDismissed(newDismissed)
        
        // Save to localStorage
        localStorage.setItem('ai-suggestions-dismissed', JSON.stringify(Array.from(newDismissed)))
        
        // Remove from visible list
        setSuggestions(prev => prev.filter(s => `${s.title}|${s.weekday}` !== key))
    }

    const handleCreateRecurring = async (suggestion: TaskSuggestion) => {
        setCreating(suggestion.title)

        try {
            const supabase = createClient()
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                console.error('Unauthorized')
                return
            }

            // Calculate next occurrence date
            const today = new Date()
            const currentWeekday = today.getUTCDay()
            const weekdayMap: Record<string, number> = {
                'SU': 0, 'MO': 1, 'TU': 2, 'WE': 3, 'TH': 4, 'FR': 5, 'SA': 6
            }
            const targetWeekday = weekdayMap[suggestion.weekday]

            // Find next occurrence of this weekday
            let nextDate = new Date(today)
            const daysUntilTarget = (targetWeekday - currentWeekday + 7) % 7
            if (daysUntilTarget === 0) {
                // If today is the target day, schedule for next week
                nextDate.setUTCDate(today.getUTCDate() + 7)
            } else {
                nextDate.setUTCDate(today.getUTCDate() + daysUntilTarget)
            }

            // Set default time to 09:00
            nextDate.setUTCHours(9, 0, 0, 0)

            const dueAt = nextDate.toISOString()
            const dueDate = extractDateFromDueAt(dueAt)

            // Create recurring task
            const { error } = await supabase.from('tasks').insert({
                title: suggestion.title,
                description: null,
                status: 'pending',
                due_at: dueAt,
                due_date: dueDate,
                recurrence_rule: `WEEKLY:${suggestion.weekday}:09:00`,
                recurrence_timezone: 'UTC',
                user_id: user.id,
            })

            if (error) {
                console.error('Error creating recurring task:', error)
                return
            }

            // Dismiss the suggestion
            handleDismiss(suggestion)

            // Refresh dashboard
            router.refresh()
        } catch (error) {
            console.error('Error creating recurring task:', error)
        } finally {
            setCreating(null)
        }
    }

    if (visibleSuggestions.length === 0) {
        return null
    }

    const weekdayNames: Record<string, string> = {
        'MO': 'Monday',
        'TU': 'Tuesday',
        'WE': 'Wednesday',
        'TH': 'Thursday',
        'FR': 'Friday',
        'SA': 'Saturday',
        'SU': 'Sunday'
    }

    return (
        <div className="mb-6 space-y-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                AI Suggestions
            </h3>
            {visibleSuggestions.map((suggestion, index) => {
                const key = `${suggestion.title}|${suggestion.weekday}`
                return (
                    <div
                        key={key}
                        className="bg-[#111] border border-[#262626] rounded-xl p-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-100 mb-1">
                                    You usually do <strong>"{suggestion.title}"</strong> on <strong>{weekdayNames[suggestion.weekday]}</strong>.
                                </p>
                                <p className="text-xs text-gray-400">
                                    Completed {suggestion.count} times in the last 30 days.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleCreateRecurring(suggestion)}
                                    disabled={creating === suggestion.title}
                                    className="px-3 py-1.5 text-xs font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {creating === suggestion.title ? '...' : 'Create recurring'}
                                </button>
                                <button
                                    onClick={() => handleDismiss(suggestion)}
                                    disabled={creating === suggestion.title}
                                    className="px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-gray-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

