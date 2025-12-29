require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.TEST_EMAIL;
const TEST_PASSWORD = process.env.TEST_PASSWORD;

if (!url || !key) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(url, key);

async function verifySchema() {
    console.log('1. Authenticating to verify schema access...');
    const { data: { session }, error: authError } = await supabase.auth.signInWithPassword({
        email: TEST_EMAIL,
        password: TEST_PASSWORD
    });

    if (authError) {
        console.error('Auth Failed:', authError.message);
        process.exit(1);
    }

    console.log('2. Querying columns due_date, due_at, start_time, end_time...');
    // Attempt to select the specific columns. 
    const { data, error } = await supabase
        .from('tasks')
        .select('id, due_date, due_at, start_time, end_time')
        .limit(1);

    if (error) {
        console.error('Schema Verification FAILED ❌');
        console.error('Error:', error);
        console.log('Status: FAIL');
    } else {
        console.log('Schema Verification PASSED ✅');
        console.log('All 4 columns detected successfully (due_date, due_at, start_time, end_time).');
        console.log('Data sample:', data);
        console.log('Status: PASS');
    }
}

verifySchema();
