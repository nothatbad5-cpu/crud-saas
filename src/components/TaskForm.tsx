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
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 disabled:opacity-50"
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
        <form action={action} className="space-y-6 bg-[#111] border border-[#262626] p-6 rounded-lg shadow">
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-100">
                    Title
                </label>
                <div className="mt-1">
                    <input
                        type="text"
                        name="title"
                        id="title"
                        required
                        defaultValue={task?.title || ''}
                        className="shadow-sm focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 block w-full sm:text-sm border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] placeholder-[#737373] rounded-md p-2"
                        placeholder="Buy groceries"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-100">
                    Description
                </label>
                <div className="mt-1">
                    <textarea
                        id="description"
                        name="description"
                        rows={3}
                        defaultValue={task?.description || ''}
                        className="shadow-sm focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 block w-full sm:text-sm border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] placeholder-[#737373] rounded-md p-2"
                        placeholder="Milk, Bread, Eggs"
                    />
                </div>
            </div>

            {/* Due Date */}
            <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-100">
                    Due Date
                </label>
                <div className="mt-1">
                    <input
                        type="date"
                        name="dueDate"
                        id="dueDate"
                        defaultValue={taskDate}
                        className="shadow-sm focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 block w-full sm:text-sm border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] rounded-md p-2"
                    />
                </div>
            </div>

            {/* Time Section */}
            <div className="border-t border-[#262626] pt-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-100 mb-3 cursor-pointer">
                    <input
                        type="checkbox"
                        name="allDay"
                        id="allDay"
                        defaultChecked={taskIsAllDay}
                        className="w-4 h-4 text-[#f5f5f5] border-[#262626] bg-[#0f0f0f] rounded focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                    />
                    All day
                </label>

                {!taskIsAllDay && (
                    <div>
                        <label htmlFor="dueTime" className="block text-xs font-medium text-gray-400 mb-1">
                            Time
                        </label>
                        <input
                            type="time"
                            name="dueTime"
                            id="dueTime"
                            defaultValue={taskTime || '09:00'}
                            className="w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 text-sm"
                        />
                    </div>
                )}
            </div>

            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-100">
                    Status
                </label>
                <div className="mt-1">
                    <select
                        id="status"
                        name="status"
                        defaultValue={task?.status || 'pending'}
                        className="shadow-sm focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 block w-full sm:text-sm border-[#262626] bg-[#0f0f0f] text-[#f5f5f5] rounded-md p-2"
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
