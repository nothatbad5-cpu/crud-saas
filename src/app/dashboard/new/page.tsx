import { createTask } from '@/app/dashboard/actions'
import TaskForm from '@/components/TaskForm'

export default function NewTaskPage({ searchParams }: { searchParams: { error?: string } }) {
    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold leading-7 text-gray-100 sm:text-3xl sm:truncate mb-6">
                Create New Task
            </h2>

            {searchParams.error && (
                <div className="mb-4 bg-[#1f1f1f] p-4 border border-[#262626] rounded text-[#f5f5f5]">
                    {typeof searchParams.error === 'string' ? searchParams.error : String(searchParams.error || '')}
                </div>
            )}

            <TaskForm action={createTask} />
        </div>
    )
}
