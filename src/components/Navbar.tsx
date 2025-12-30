'use client'

import React, { useState } from 'react'
import { signOut } from '@/app/dashboard/actions'

export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <nav className="bg-[#111] shadow sticky top-0 z-40 md:static">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-12 md:h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <span className="text-xl font-bold text-gray-100">SaaS MVP</span>
                        </div>
                    </div>
                    {/* Desktop actions */}
                    <div className="hidden md:flex items-center">
                        <button
                            onClick={() => signOut()}
                            className="ml-4 px-4 py-2 border border-[#262626] rounded-md shadow-sm text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                        >
                            Sign out
                        </button>
                    </div>
                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 text-gray-100 hover:bg-[#161616] rounded-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                            aria-label="Menu"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Mobile menu dropdown */}
                {isMenuOpen && (
                    <>
                        <div 
                            className="fixed inset-0 bg-black/50 z-40 md:hidden"
                            onClick={() => setIsMenuOpen(false)}
                        />
                        <div className="absolute top-16 right-3 w-56 bg-[#111] border border-[#262626] rounded-lg shadow-xl z-50 md:hidden">
                            <div className="py-2">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false)
                                        signOut()
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-100 hover:bg-[#161616] focus:outline-none"
                                >
                                    Sign out
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </nav>
    )
}
