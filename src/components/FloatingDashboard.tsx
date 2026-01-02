'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface FloatingDashboardProps {
    count: number
    limit: number
    isPro?: boolean
    onOpenCreateModal?: () => void
}

export default function FloatingDashboard({ count, limit, isPro = false, onOpenCreateModal }: FloatingDashboardProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const drawerRef = useRef<HTMLDivElement>(null)
    const fabRef = useRef<HTMLButtonElement>(null)
    const closeRef = useRef<HTMLButtonElement>(null)

    const isUnlimited = isPro || limit === -1 || !isFinite(limit)
    const percentage = isUnlimited ? 0 : Math.min(100, Math.round((count / limit) * 100))
    const remaining = isUnlimited ? null : Math.max(0, limit - count)

    // Handle Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }
        if (isOpen) {
            window.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
            // Focus close button on open
            closeRef.current?.focus()
        } else {
            document.body.style.overflow = ''
            // Return focus to FAB on close
            fabRef.current?.focus()
        }
        return () => {
            window.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = ''
        }
    }, [isOpen])

    // Close on click outside
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
            setIsOpen(false)
        }
    }

    const handleNewTaskClick = () => {
        setIsOpen(false)
        if (onOpenCreateModal) {
            onOpenCreateModal()
        }
    }

    return (
        <div className="relative">
            {/* Floating Action Button */}
            <button
                ref={fabRef}
                onClick={() => setIsOpen(true)}
                aria-label="Open dashboard panel"
                className="hidden md:block fixed z-40 p-4 bg-[#f5f5f5] text-[#0b0b0b] rounded-full shadow-lg hover:bg-[#e5e5e5] transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 group pointer-events-auto"
                style={{ bottom: 'calc(16px + env(safe-area-inset-bottom))', right: '1.5rem' }}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>

                {/* Badge */}
                {!isPro && remaining !== null && (
                    <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#1f1f1f] text-[#f5f5f5] text-[10px] font-bold border-2 border-[#0b0b0b] shadow-sm">
                        {remaining}
                    </span>
                )}
                {isPro && (
                    <span className="absolute -top-1 -right-1 flex px-1.5 py-0.5 items-center justify-center rounded-full bg-[#1f1f1f] text-[#f5f5f5] text-[8px] font-bold border-2 border-[#0b0b0b] shadow-sm uppercase tracking-wider">
                        Pro
                    </span>
                )}

                {/* Tooltip */}
                <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                    Quick Panel
                </span>
            </button>

            {/* Backdrop Overlay */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleBackdropClick}
            >
                {/* Slide-over Drawer */}
                <div
                    ref={drawerRef}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="quick-panel-title"
                    className={`fixed top-0 right-0 h-full w-80 max-w-full bg-[#111] border-l border-[#262626] shadow-2xl transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Header */}
                    <div className="p-6 border-b border-[#262626] flex justify-between items-center">
                        <h2 id="quick-panel-title" className="text-xl font-bold text-gray-100">Quick Panel</h2>
                        <button
                            ref={closeRef}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close panel"
                            className="p-2 text-gray-400 hover:text-gray-100 hover:bg-[#161616] rounded-lg transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8">
                        {/* Usage Section */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Usage</span>
                                <span className="text-sm font-bold text-[#f5f5f5]">
                                    {isUnlimited ? '∞' : `${count} / ${limit}`}
                                </span>
                            </div>

                            {!isUnlimited && (
                                <div className="space-y-2">
                                    <div className="w-full bg-[#161616] rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full bg-[#a3a3a3] transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-[10px] text-gray-500 text-right">
                                        {percentage}% of your task limit used
                                    </p>

                                    {count >= limit && !isPro && (
                                        <div className="p-3 bg-[#1f1f1f] border border-[#262626] rounded-lg">
                                            <p className="text-xs text-[#f5f5f5] font-medium">
                                                🚨 Limit reached! Upgrade for more.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {isPro && (
                                <div className="p-3 bg-[#1f1f1f] border border-[#262626] rounded-lg">
                                    <p className="text-xs text-[#f5f5f5] font-medium flex items-center">
                                        <span className="mr-2">✨</span> Pro Plan Active
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3 pt-4 border-t border-[#262626]">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Actions</span>

                            <button
                                onClick={handleNewTaskClick}
                                className={`flex items-center w-full px-4 py-3 rounded-xl shadow-sm text-sm font-medium transition-all ${!isPro && count >= limit
                                    ? 'bg-[#161616] text-gray-500 cursor-not-allowed grayscale'
                                    : 'bg-[#f5f5f5] text-[#0b0b0b] hover:bg-[#e5e5e5] hover:shadow-md'
                                    }`}
                            >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Task
                            </button>

                            <Link
                                href="/dashboard"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center w-full px-4 py-3 bg-[#161616] border border-[#262626] text-[#f5f5f5] hover:bg-[#1f1f1f] rounded-xl text-sm font-medium transition-all shadow-sm"
                            >
                                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                Full Dashboard
                            </Link>

                            {!isPro && (
                                <Link
                                    href="/pricing"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center w-full px-4 py-3 bg-[#1f1f1f] border border-[#262626] text-[#f5f5f5] hover:bg-[#262626] rounded-xl text-sm font-bold transition-all shadow-sm"
                                >
                                    <svg className="w-4 h-4 mr-3 text-[#f5f5f5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Upgrade to Pro
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    {!isPro && (
                        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 border-t">
                            <p className="text-[11px] text-center text-gray-500 italic">
                                Tip: Upgrade for unlimited tasks and priority support.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
