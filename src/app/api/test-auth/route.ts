import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const { email, password, action } = await request.json();
        
        // Check environment variables
        const envCheck = {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
            urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...' || 'N/A',
        };
        
        // Try to create Supabase client
        let clientError = null;
        let supabase = null;
        try {
            supabase = await createClient();
        } catch (error: any) {
            clientError = {
                message: error.message,
                stack: error.stack,
            };
        }
        
        if (clientError) {
            return NextResponse.json({
                success: false,
                error: 'Failed to create Supabase client',
                clientError,
                envCheck,
            }, { status: 500 });
        }
        
        // Try the auth operation
        let authResult = null;
        let authError = null;
        
        try {
            if (action === 'signup') {
                const result = await supabase!.auth.signUp({ email, password });
                authResult = {
                    user: result.data.user ? { id: result.data.user.id, email: result.data.user.email } : null,
                    session: result.data.session ? 'Session created' : 'No session',
                    error: result.error ? {
                        message: result.error.message,
                        status: result.error.status,
                        name: result.error.name,
                    } : null,
                };
            } else if (action === 'login') {
                const result = await supabase!.auth.signInWithPassword({ email, password });
                authResult = {
                    user: result.data.user ? { id: result.data.user.id, email: result.data.user.email } : null,
                    session: result.data.session ? 'Session created' : 'No session',
                    error: result.error ? {
                        message: result.error.message,
                        status: result.error.status,
                        name: result.error.name,
                    } : null,
                };
            }
        } catch (error: any) {
            authError = {
                message: error.message,
                status: error.status,
                statusCode: error.statusCode,
                name: error.name,
                code: error.code,
                stack: error.stack?.substring(0, 500),
            };
        }
        
        return NextResponse.json({
            success: !authError && !authResult?.error,
            envCheck,
            clientError,
            authResult,
            authError,
        });
        
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: 'Unexpected error in test route',
            message: error.message,
            stack: error.stack?.substring(0, 500),
        }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({
        env: {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
            key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        },
        message: 'Use POST with { email, password, action: "signup" | "login" }',
    });
}

