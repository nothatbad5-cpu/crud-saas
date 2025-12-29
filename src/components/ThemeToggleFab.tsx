'use client'

import { useEffect, useState } from 'react'

export default function ThemeToggleFab() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        
        // Sync with theme already set by beforeInteractive script
        const isDark = document.documentElement.classList.contains('dark')
        setTheme(isDark ? 'dark' : 'light')
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        
        // Explicitly set/remove dark class based on newTheme
        document.documentElement.classList.toggle('dark', newTheme === 'dark')
        
        // Debug logging
        console.log('Theme toggle:', {
            nextTheme: newTheme,
            htmlClassName: document.documentElement.className,
            hasDarkClass: document.documentElement.classList.contains('dark')
        })
        
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute('content', newTheme === "dark" ? "#0b0b0b" : "#ffffff")
    }

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return null
    }

    return (
        <button
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center text-xl hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    )
}

