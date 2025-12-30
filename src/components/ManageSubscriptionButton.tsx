'use client'

import React from 'react'

export default function ManageSubscriptionButton() {
    const [loading, setLoading] = React.useState(false)

    const handlePortal = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            })
            const data = await response.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                alert('Failed to load portal')
            }
        } catch (error) {
            console.error(error)
            alert('Error loading portal')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handlePortal}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-[#262626] shadow-sm text-sm font-medium rounded-md text-[#f5f5f5] bg-[#161616] hover:bg-[#1f1f1f] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0 disabled:opacity-50"
        >
            {loading ? 'Loading...' : 'Manage Subscription'}
        </button>
    )
}
