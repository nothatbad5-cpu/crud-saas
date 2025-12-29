import Link from "next/link";
import GuestLoginButton from "@/components/GuestLoginButton";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        redirect("/dashboard");
    }
    
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0b]">
            <div className="w-full max-w-md space-y-8 p-8 bg-[#111] rounded-lg shadow">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-100">TaskMaster</h1>
                    <p className="mt-2 text-lg text-gray-400">
                        The simplest way to manage your daily tasks
                    </p>
                </div>
                
                <div className="space-y-4">
                    <Link
                        href="/signup"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Get Started
                    </Link>
                    
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
                        <p className="mt-2 text-xs text-center text-gray-500">
                            Try it without an account
                        </p>
                    </div>
                </div>
                
                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
