import { createTask } from '@/app/dashboard/actions'
import TaskForm from '@/components/TaskForm'

export default function NewTaskPage({ searchParams }: { searchParams: { error?: string } }) {
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate mb-6">
                Create New Task
            </h2>

            {searchParams.error && (
                <div className="mb-4 bg-red-50 p-4 border border-red-200 rounded text-red-600">
                    {searchParams.error}
                </div>
            )}

            <TaskForm action={createTask} />
        </div>
    )
}
