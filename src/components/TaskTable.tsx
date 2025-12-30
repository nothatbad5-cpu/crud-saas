'use client'

import React from 'react'
import Link from 'next/link'
import { deleteTask } from '@/app/dashboard/actions'

interface Task {
    id: string
    title: string
    description: string | null
    status: 'pending' | 'completed'
    created_at: string
}

export default function TaskTable({ tasks }: { tasks: Task[] }) {
    if (tasks.length === 0) {
        return (
            <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-medium text-gray-100">No tasks</h3>
                <p className="mt-1 text-sm text-gray-400">Get started by creating a new task.</p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                    >
                        New Task
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {/* Mobile Card View */}
            <div className="block md:hidden space-y-2">
                {tasks.map((task) => (
                    <div key={task.id} className="bg-[#111] border border-[#262626] rounded-xl p-3">
                        {/* Top row: Title + Status */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h3 className="text-sm font-medium text-gray-100 break-words flex-1 line-clamp-2">
                                {task.title}
                            </h3>
                            <span className="px-2 py-0.5 inline-flex text-xs font-semibold rounded-full bg-[#1f1f1f] text-[#e5e5e5] border border-[#262626] flex-shrink-0">
                                {task.status}
                            </span>
                        </div>
                        {/* Description */}
                        {task.description && (
                            <p className="text-xs text-gray-400 mb-1.5 break-words line-clamp-1">
                                {task.description}
                            </p>
                        )}
                        {/* Second row: Created date */}
                        <div className="text-xs text-gray-400 mb-2">
                            {new Date(task.created_at).toLocaleDateString()}
                        </div>
                        {/* Bottom row: Actions */}
                        <div className="flex gap-2 pt-2 border-t border-[#262626]">
                            <Link 
                                href={`/dashboard/${task.id}/edit`} 
                                className="flex-1 text-center px-3 py-1.5 text-xs font-medium text-[#f5f5f5] bg-[#161616] hover:bg-[#1f1f1f] rounded-md transition-colors"
                            >
                                Edit
                            </Link>
                            <button
                                onClick={async () => {
                                    if (confirm('Are you sure you want to delete this task?')) {
                                        await deleteTask(task.id)
                                    }
                                }}
                                className="flex-1 px-3 py-1.5 text-xs font-medium text-[#f5f5f5] bg-[#161616] hover:bg-[#1f1f1f] rounded-md transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                    <div className="shadow overflow-hidden border-b border-[#262626] sm:rounded-lg">
                        <table className="min-w-full divide-y divide-[#262626]">
                            <thead className="bg-[#111]">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Title
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                        Created At
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-[#111] divide-y divide-[#262626]">
                                {tasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-[#161616]">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-100">{task.title}</div>
                                            <div className="text-sm text-gray-400">{task.description}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-[#1f1f1f] text-[#e5e5e5] border border-[#262626]">
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {new Date(task.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link href={`/dashboard/${task.id}/edit`} className="text-[#f5f5f5] hover:opacity-80 mr-4">
                                                Edit
                                            </Link>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Are you sure you want to delete this task?')) {
                                                        await deleteTask(task.id)
                                                    }
                                                }}
                                                className="text-[#f5f5f5] hover:opacity-80"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
