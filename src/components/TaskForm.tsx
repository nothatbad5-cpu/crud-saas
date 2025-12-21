'use client'

import { useFormStatus } from 'react-dom'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
            {pending ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Task' : 'Create Task')}
        </button>
    )
}

export default function TaskForm({
    task,
    action,
}: {
    task?: Task
    action: (formData: FormData) => Promise<void>
}) {
    return (
        <form action={action} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Title
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={task?.title || ''}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="Buy groceries"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                </label>
                <div className="mt-1">
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={task?.description || ''}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                        placeholder="Milk, Bread, Eggs"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                </label>
                <div className="mt-1">
                    <select
                        id="status"
                        name="status"
                        defaultValue={task?.status || 'pending'}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-end">
                <SubmitButton isEditing={!!task} />
            </div>
        </form>
    )
}
