import React from 'react'
import SubscribeButton from '@/components/SubscribeButton'

export default function PricingPage() {
    const isBillingConfigured = !!process.env.STRIPE_PRICE_ID

    return (
        <div className="bg-[#0b0b0b] min-h-screen py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl font-extrabold text-gray-100 sm:text-4xl">
                    Simple, transparent pricing
                </h2>
                <p className="mt-4 text-xl text-gray-400">
                    Get access to all premium features.
                </p>
            </div>

            <div className="mt-12 bg-[#111] rounded-lg shadow-lg overflow-hidden max-w-sm mx-auto">
                <div className="px-6 py-8">
                    <h3 className="text-2xl font-semibold text-gray-100 text-center">Pro Plan</h3>
                    <p className="mt-4 text-center text-gray-400">
                        For individuals who want to get things done.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <span className="text-5xl font-extrabold text-gray-100">$10</span>
                        <span className="text-xl text-gray-400 self-end ml-1">/mo</span>
                    </div>
                </div>
                <div className="px-6 pb-8 bg-[#161616] text-center">
                    {isBillingConfigured ? (
                        <SubscribeButton />
                    ) : (
                        <div className="text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-200">
                            Billing is not configured yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
