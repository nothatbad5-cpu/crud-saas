'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/app/dashboard/actions'

export default function OnboardingModal({ isOpen }: { isOpen: boolean }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    if (!isOpen) return null

    const handleComplete = async (redirectParams?: string) => {
        setLoading(true)
        await completeOnboarding()
        setLoading(false)
        if (redirectParams) {
            router.push(redirectParams)
        } else {
            router.refresh()
        }
    }

    return (
        <div 
            className="fixed inset-0 z-50 overflow-y-auto pointer-events-none" 
            aria-labelledby="modal-title" 
            role="dialog" 
            aria-modal="true"
        >
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0 pointer-events-none">
                <div 
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity pointer-events-auto" 
                    aria-hidden="true"
                    onClick={() => handleComplete()}
                ></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div 
                    className="inline-block align-bottom bg-[#111] border border-[#262626] rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-sm sm:w-full sm:p-6 relative z-10 pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-[#1f1f1f] border border-[#262626]">
                            <svg className="h-6 w-6 text-[#f5f5f5]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div className="mt-3 text-center sm:mt-5">
                            <h3 className="text-lg leading-6 font-medium text-[#f5f5f5]" id="modal-title">
                                Welcome to TaskMaster!
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-[#a3a3a3]">
                                    The simplest way to manage your daily tasks. Get started by creating your first task now.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-5 sm:mt-6">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleComplete('/dashboard/new')}
                            className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#f5f5f5] text-base font-medium text-[#0b0b0b] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 sm:text-sm disabled:opacity-50"
                        >
                            {loading ? 'Setting up...' : 'Create your first task'}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handleComplete()}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-[#262626] shadow-sm px-4 py-2 bg-transparent text-base font-medium text-[#f5f5f5] hover:bg-[#161616] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 sm:text-sm"
                        >
                            Skip for now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
