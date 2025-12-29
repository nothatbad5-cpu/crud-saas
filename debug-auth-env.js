require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('--- 1. ENVIRONMENT VERIFICATION ---');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '(Present)' : '(Missing)');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
    console.error('CRITICAL: Missing Supabase URL or Key');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkAuth() {
    console.log('\n--- 2. SUPABASE AUTH CHECK ---');
    // Try to sign in with a clearly fake user to see the error response
    // We expect "Invalid login credentials" (400) if connection works.
    // If we get "FetchError" or 500, it's network/config.
    const email = 'diagnostic-test@example.com';
    const password = 'diagnostic-password-123';

    console.log(`Attempting login with: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.log('Supabase Error Returned:');
        console.log('Message:', error.message);
        console.log('Status:', error.status);
        console.log('Name:', error.name);
    } else {
        console.log('Unexpected Success (User exists?)');
    }
}

checkAuth();
