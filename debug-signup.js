require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('URL:', url);
console.log('Key length:', key ? key.length : 0);

if (!url || !key) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function testSignup() {
    const email = `test-debug-${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Attempting signup with ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });

    if (error) {
        console.error('Signup Error:', error);
    } else {
        console.log('Signup Success:', data);
    }
}

testSignup();
