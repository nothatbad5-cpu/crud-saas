'use client'

import React from 'react'
import { signOut } from '@/app/dashboard/actions'

export default function Navbar() {
    return (
        <nav className="bg-[#111] shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-100">SaaS MVP</span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <button
                            onClick={() => signOut()}
                            className="ml-4 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
