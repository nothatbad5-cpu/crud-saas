const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 800 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    
    console.log(`\n=== Complete Guest Mode Test ===\n`);
    console.log(`Testing: ${baseURL}\n`);
    
    const results = {
        homePage: false,
        guestLogin: false,
        dashboard: false,
        taskCreation: false,
        loginPage: false
    };
    
    try {
        // Test 1: Home page loads with guest button
        console.log('1. Testing home page...');
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-complete-1-home.png' });
        
        const guestButton = page.getByRole('button', { name: /continue as guest/i });
        const getStartedLink = page.getByRole('link', { name: /get started/i });
        
        const guestVisible = await guestButton.isVisible();
        const getStartedVisible = await getStartedLink.isVisible();
        
        if (guestVisible && getStartedVisible) {
            console.log('   ✅ Home page shows guest button and Get Started link');
            results.homePage = true;
        } else {
            console.log('   ❌ Home page missing elements');
        }
        
        // Test 2: Guest login from home page
        console.log('\n2. Testing guest login from home page...');
        await guestButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test-complete-2-after-guest-login.png' });
        
        const currentURL = page.url();
        if (currentURL.includes('/dashboard')) {
            console.log('   ✅ Guest login successful - redirected to dashboard');
            results.guestLogin = true;
        } else {
            console.log(`   ❌ Not redirected to dashboard. Current URL: ${currentURL}`);
        }
        
        // Test 3: Dashboard loads
        console.log('\n3. Testing dashboard access...');
        await page.waitForTimeout(2000);
        const dashboardHeading = await page.locator('text=/dashboard/i').first().isVisible().catch(() => false);
        const hasContent = await page.locator('text=/task|table|calendar|new task/i').first().isVisible().catch(() => false);
        
        if (dashboardHeading || hasContent) {
            console.log('   ✅ Dashboard loads correctly');
            results.dashboard = true;
        } else {
            console.log('   ❌ Dashboard not loading');
        }
        
        // Test 4: Create a task as guest
        console.log('\n4. Testing task creation as guest...');
        try {
            const newTaskButton = page.getByRole('button', { name: /new task/i }).first();
            if (await newTaskButton.isVisible()) {
                await newTaskButton.click();
                await page.waitForTimeout(1000);
                
                const taskTitle = `Guest Test Task ${Date.now()}`;
                const titleInput = page.locator('input[placeholder*="title" i], input[name="title"], input[id="title"]').first();
                await titleInput.fill(taskTitle);
                
                await page.getByRole('button', { name: /create/i }).click();
                await page.waitForTimeout(2000);
                await page.screenshot({ path: 'test-complete-3-task-created.png' });
                
                const taskVisible = await page.locator(`text=${taskTitle}`).isVisible().catch(() => false);
                if (taskVisible) {
                    console.log('   ✅ Guest can create tasks');
                    results.taskCreation = true;
                } else {
                    console.log('   ❌ Task not visible after creation');
                }
            }
        } catch (error) {
            console.log(`   ⚠️  Task creation test: ${error.message}`);
        }
        
        // Test 5: Sign out and test login page guest button
        console.log('\n5. Testing login page guest button...');
        await page.getByRole('button', { name: /sign out/i }).click();
        await page.waitForURL('**/login', { timeout: 5000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'test-complete-4-login-page.png' });
        
        const loginGuestButton = page.getByRole('button', { name: /continue as guest/i });
        if (await loginGuestButton.isVisible()) {
            console.log('   ✅ Login page shows guest button');
            results.loginPage = true;
            
            // Try guest login from login page
            await loginGuestButton.click();
            await page.waitForTimeout(3000);
            const loginURL = page.url();
            if (loginURL.includes('/dashboard')) {
                console.log('   ✅ Guest login from login page works');
            } else {
                console.log(`   ⚠️  Login page guest redirect: ${loginURL}`);
            }
        } else {
            console.log('   ❌ Login page missing guest button');
        }
        
        // Summary
        console.log('\n=== Test Summary ===');
        console.log(`Home Page: ${results.homePage ? '✅' : '❌'}`);
        console.log(`Guest Login: ${results.guestLogin ? '✅' : '❌'}`);
        console.log(`Dashboard: ${results.dashboard ? '✅' : '❌'}`);
        console.log(`Task Creation: ${results.taskCreation ? '✅' : '❌'}`);
        console.log(`Login Page: ${results.loginPage ? '✅' : '❌'}`);
        
        const allPassed = Object.values(results).every(r => r);
        if (allPassed) {
            console.log('\n🎉 All tests passed! Guest mode is fully functional.');
        } else {
            console.log('\n⚠️  Some tests failed. Check details above.');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-complete-error.png' });
    } finally {
        console.log('\nScreenshots saved: test-complete-*.png');
        await page.waitForTimeout(3000);
        await browser.close();
    }
})();


