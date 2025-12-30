import { updateTask } from '@/app/dashboard/actions'
import TaskForm from '@/components/TaskForm'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function EditTaskPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>
    searchParams: { error?: string }
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: task } = await supabase.from('tasks').select('*').eq('id', id).single()

    if (!task) {
        notFound()
    }

    const updateTaskWithId = updateTask.bind(null, id)
    const resolvedSearchParams = searchParams

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold leading-7 text-gray-100 sm:text-3xl sm:truncate mb-6">
                Edit Task
            </h2>

            {resolvedSearchParams?.error && (
                <div className="mb-4 bg-[#1f1f1f] p-4 border border-[#262626] rounded text-[#f5f5f5]">
                    {typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : String(resolvedSearchParams.error || '')}
                </div>
            )}

            <TaskForm task={task} action={updateTaskWithId} />
        </div>
    )
}
