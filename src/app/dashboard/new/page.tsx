'use client'

import { createTask } from '@/app/dashboard/actions'
import TaskForm from '@/components/TaskForm'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTaskPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (formData: FormData) => {
        setError(null)
        startTransition(async () => {
            try {
                await createTask(formData)
                // If we reach here without redirect, something went wrong
                // But createTask should always redirect on success
            } catch (err: any) {
                // Check if it's a redirect error (from redirect() call)
                if (err?.digest?.startsWith('NEXT_REDIRECT')) {
                    // Redirect is happening, let it proceed
                    return
                }
                // Display error inline
                setError(err?.message || 'An unexpected error occurred. Please try again.')
            }
        })
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold leading-7 text-gray-100 sm:text-3xl sm:truncate mb-6">
                Create New Task
            </h2>

            {error && (
                <div className="mb-4 bg-[#1f1f1f] p-4 border border-red-500/30 rounded text-red-400">
                    {error}
                </div>
            )}

            <TaskForm action={handleSubmit} />
        </div>
    )
}
