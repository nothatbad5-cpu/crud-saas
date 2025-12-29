import { login } from '@/app/auth/actions'
import GuestLoginButton from '@/components/GuestLoginButton'

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function LoginPage(props: { searchParams: { error?: string } }) {
    const searchParams = props.searchParams
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b]">
            <div className="w-full max-w-md space-y-8 p-8 bg-[#111] rounded-lg shadow">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-100">Sign in to your account</h2>
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-[#161616] placeholder-gray-500 text-gray-100 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
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
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-[#161616] placeholder-gray-500 text-gray-100 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    {searchParams?.error && (
                        <div className="text-red-500 text-sm text-center">{searchParams.error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            formAction={login}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-[#111] text-gray-400">Or</span>
                        </div>
                    </div>
                    <div>
                        <GuestLoginButton />
                    </div>
                    <div className="text-center text-sm">
                        <a href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Don&apos;t have an account? Sign up
                        </a>
                    </div>
                </form>
            </div>
        </div>
    )
}
