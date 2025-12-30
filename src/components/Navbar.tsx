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
                            className="ml-4 px-4 py-2 border border-[#262626] rounded-md shadow-sm text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    )
}
