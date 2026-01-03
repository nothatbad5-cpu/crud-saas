import { login } from '@/app/auth/actions'

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LoginPage(props: { searchParams: Promise<{ error?: string }> }) {
    const searchParams = await props.searchParams
    return (
        <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
            <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                <div className="text-center">
                    <h2 className="mt-6 text-xl sm:text-2xl font-extrabold text-gray-100">Sign in to your account</h2>
                </div>
                <form className="mt-8 space-y-6">
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email address</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] placeholder-[#737373] text-[#f5f5f5] rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-[#262626] bg-[#0f0f0f] placeholder-[#737373] text-[#f5f5f5] rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:border-[#a3a3a3] focus:ring-offset-0 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {searchParams?.error && (
                        <div className="text-[#f5f5f5] text-sm text-center">{typeof searchParams?.error === 'string' ? searchParams.error : String(searchParams?.error || '')}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            formAction={login}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                        >
                            Sign in
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <a href="/signup" className="font-medium text-[#f5f5f5] hover:opacity-80">
                            Don&apos;t have an account? Sign up
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
