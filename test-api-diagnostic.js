const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    const testEmail = process.env.TEST_EMAIL || 'tester_unique_999@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'YourStrongPasswordHere';
    
    console.log(`\n=== API Diagnostic Test ===\n`);
    
    try {
        // Test signup via API
        console.log('1. Testing signup via API...');
        const signupResponse = await page.request.post(`${baseURL}/api/test-auth`, {
            data: {
                email: testEmail,
                password: testPassword,
                action: 'signup'
            }
        });
        
        const signupData = await signupResponse.json();
        console.log('Signup Result:');
        console.log(JSON.stringify(signupData, null, 2));
        
        if (signupData.success) {
            console.log('   ✅ Signup successful via API!');
        } else {
            console.log('   ❌ Signup failed via API');
            if (signupData.authError) {
                console.log('   Auth Error:', signupData.authError);
            }
            if (signupData.clientError) {
                console.log('   Client Error:', signupData.clientError);
            }
        }
        
        // Wait a bit
        await page.waitForTimeout(2000);
        
        // Test login via API
        console.log('\n2. Testing login via API...');
        const loginResponse = await page.request.post(`${baseURL}/api/test-auth`, {
            data: {
                email: testEmail,
                password: testPassword,
                action: 'login'
            }
        });
        
        const loginData = await loginResponse.json();
        console.log('Login Result:');
        console.log(JSON.stringify(loginData, null, 2));
        
        if (loginData.success) {
            console.log('   ✅ Login successful via API!');
        } else {
            console.log('   ❌ Login failed via API');
            if (loginData.authError) {
                console.log('   Auth Error:', loginData.authError);
            }
            if (loginData.clientError) {
                console.log('   Client Error:', loginData.clientError);
            }
        }
        
        // Check environment variables
        console.log('\n3. Environment Check:');
        console.log('   URL:', signupData.envCheck?.url || loginData.envCheck?.url);
        console.log('   Key:', signupData.envCheck?.key || loginData.envCheck?.key);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
})();

