'use client'

import React from 'react'

export default function SubscribeButton() {
    const [loading, setLoading] = React.useState(false)

    const handleSubscribe = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert('Failed to start checkout')
            }
        } catch (error) {
            console.error(error)
            alert('Error starting checkout')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-[#f5f5f5] border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-[#0b0b0b] hover:bg-[#e5e5e5] disabled:opacity-50"
        >
            {loading ? 'Processing...' : 'Subscribe'}
        </button>
    )
}
