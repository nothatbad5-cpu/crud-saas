'use client'

import { useFormStatus } from 'react-dom'
import { extractDateFromDueAt, extractTimeFromDueAt, isAllDayTask } from '@/lib/datetime-utils'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    due_at?: string | null
    due_date?: string | null
    start_time?: string | null
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
    // Extract date and time from due_at or fallback to due_date/start_time
    const taskDate = task?.due_at 
        ? (extractDateFromDueAt(task.due_at) || task?.due_date || new Date().toISOString().split('T')[0])
        : (task?.due_date || new Date().toISOString().split('T')[0])
    
    const taskTime = task?.due_at 
        ? extractTimeFromDueAt(task.due_at) 
        : task?.start_time || null
    
    const taskIsAllDay = task?.due_at ? (isAllDayTask(task.due_at) ?? true) : !taskTime

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

            {/* Due Date */}
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                </label>
                <div className="mt-1">
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        defaultValue={taskDate}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                    />
                </div>
            </div>

            {/* Time Section */}
            <div className="border-t border-gray-200 pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="allDay"
                        id="allDay"
                        defaultChecked={taskIsAllDay}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    All day
                </label>

                {!taskIsAllDay && (
                    <div>
                        <label htmlFor="dueTime" className="block text-xs font-medium text-gray-600 mb-1">
                            Time
                        </label>
                        <input
                            type="time"
                            name="dueTime"
                            id="dueTime"
                            defaultValue={taskTime || '09:00'}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                        />
                    </div>
                )}
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
