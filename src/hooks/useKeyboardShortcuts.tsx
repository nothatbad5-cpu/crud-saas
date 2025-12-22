'use client'

import { useEffect, useCallback } from 'react'

interface KeyboardShortcut {
    key: string
    ctrlKey?: boolean
    shiftKey?: boolean
    altKey?: boolean
    handler: () => void
    description: string
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
    const handleKeyDown = useCallback(
        (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return
            }

            for (const shortcut of shortcuts) {
                const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase()
                const ctrlMatches = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey
                const shiftMatches = shortcut.shiftKey ? event.shiftKey : !event.shiftKey
                const altMatches = shortcut.altKey ? event.altKey : !event.altKey

                if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
                    event.preventDefault()
                    shortcut.handler()
                    break
                }
            }
        },
        [shortcuts]
    )

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

export function KeyboardShortcutsHelp({ shortcuts }: { shortcuts: KeyboardShortcut[] }) {
    return (
        <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-30 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Keyboard Shortcuts</h3>
            <div className="space-y-1">
                {shortcuts.map((shortcut, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">{shortcut.description}</span>
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-gray-700 font-mono">
                            {shortcut.ctrlKey && 'Ctrl+'}
                            {shortcut.shiftKey && 'Shift+'}
                            {shortcut.altKey && 'Alt+'}
                            {shortcut.key.toUpperCase()}
                        </kbd>
                    </div>
                ))}
            </div>
        </div>
    )
}
