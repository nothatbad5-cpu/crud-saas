import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
        redirect("/dashboard");
    }
    
    return (
        <div className="flex min-h-[100svh] items-start sm:items-center justify-center bg-[#0b0b0b] px-4 pt-8 pb-12">
            <div className="w-full max-w-md space-y-8 p-4 sm:p-6 bg-[#111] border border-[#262626] rounded-xl">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-100">TaskMaster</h1>
                    <p className="mt-2 text-lg text-gray-400">
                        The simplest way to manage your daily tasks
                    </p>
                </div>
                
                <div className="space-y-4">
                    <Link
                        href="/signup"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#0b0b0b] bg-[#f5f5f5] hover:bg-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#a3a3a3] focus:ring-offset-0"
                    >
                        Get Started
                    </Link>
                    
                </div>
                
                <div className="text-center text-sm">
                    <Link href="/login" className="font-medium text-[#f5f5f5] hover:opacity-80">
                        Already have an account? Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
