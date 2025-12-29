const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen to console messages
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    const testEmail = process.env.TEST_EMAIL || 'tester_unique_999@example.com';
    const testPassword = process.env.TEST_PASSWORD || 'YourStrongPasswordHere';
    
    console.log(`\n=== Testing with Credentials ===`);
    console.log(`URL: ${baseURL}`);
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword.substring(0, 3)}...\n`);
    
    try {
        // Step 1: Try to sign up first
        console.log('1. Attempting signup...');
        await page.goto(`${baseURL}/signup`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-1-signup-page.png' });
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.getByRole('button', { name: /sign up/i }).click();
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-2-after-signup.png' });
        
        const signupURL = page.url();
        console.log(`   Signup result URL: ${signupURL}`);
        
        if (signupURL.includes('/dashboard')) {
            console.log('   ✅ Signup successful! Redirected to dashboard');
        } else if (signupURL.includes('error')) {
            const errorMsg = await page.locator('text=/error/i').first().textContent().catch(() => 'Unknown');
            console.log(`   ⚠️  Signup error: ${errorMsg}`);
            console.log('   (User might already exist - will try login)');
        }
        
        // Step 2: Try to login
        console.log('\n2. Attempting login...');
        await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-3-login-page.png' });
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.getByRole('button', { name: /sign in/i }).click();
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-4-after-login.png' });
        
        const loginURL = page.url();
        console.log(`   Login result URL: ${loginURL}`);
        
        if (loginURL.includes('/dashboard')) {
            console.log('   ✅ Login successful! Redirected to dashboard');
            
            // Step 3: Verify dashboard loads
            console.log('\n3. Verifying dashboard...');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-5-dashboard.png' });
            
            const dashboardHeading = await page.locator('text=/dashboard/i').first().isVisible().catch(() => false);
            if (dashboardHeading) {
                console.log('   ✅ Dashboard is visible!');
                
                // Try to create a task
                console.log('\n4. Testing task creation...');
                const newTaskButton = page.getByRole('button', { name: /new task/i }).first();
                if (await newTaskButton.isVisible()) {
                    await newTaskButton.click();
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'test-6-create-task-modal.png' });
                    console.log('   ✅ Create task modal opened');
                }
            } else {
                console.log('   ⚠️  Dashboard heading not found');
            }
        } else if (loginURL.includes('error')) {
            const errorMsg = await page.locator('text=/error/i').first().textContent().catch(() => 'Unknown');
            console.log(`   ❌ Login failed: ${errorMsg}`);
            console.log(`   Full URL: ${loginURL}`);
        } else {
            console.log(`   ⚠️  Unexpected URL: ${loginURL}`);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-error.png' });
    } finally {
        console.log('\n=== Screenshots saved ===');
        console.log('Check the test-*.png files for visual confirmation');
        
        // Keep browser open for 10 seconds so user can see
        console.log('\nBrowser will close in 10 seconds...');
        await page.waitForTimeout(10000);
        await browser.close();
    }
})();

