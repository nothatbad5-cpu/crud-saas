import Link from 'next/link'

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="px-4 lg:px-6 h-14 flex items-center">
                <Link className="flex items-center justify-center font-bold text-lg" href="#">
                    SaaS MVP
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Login
                    </Link>
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/signup">
                        Sign Up
                    </Link>
                </nav>
            </header>
            <main className="flex-1">
                <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-100">
                    <div className="px-4 md:px-6 text-center">
                        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                            Manage your tasks efficiently
                        </h1>
                        <p className="mx-auto mt-4 max-w-[700px] text-gray-500 md:text-xl">
                            A simple, secure, and production-ready task management tool.
                        </p>
                        <div className="mt-8 flex justify-center gap-4">
                            <Link
                                href="/signup"
                                className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-600 px-8 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700 disabled:pointer-events-none disabled:opacity-50"
                            >
                                Get Started
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-8 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500">
                    © 2024 SaaS MVP. All rights reserved.
                </p>
            </footer>
        </div>
    )
}
