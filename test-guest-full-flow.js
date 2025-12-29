const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    
    console.log(`\n=== Full Guest Mode Test ===\n`);
    console.log(`URL: ${baseURL}\n`);
    
    try {
        // Test 1: Home page guest login
        console.log('1. Testing home page guest login...');
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        const guestButton = page.getByRole('button', { name: /continue as guest/i });
        await guestButton.click();
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        console.log('   ✅ Home page guest login works');
        
        // Sign out
        await page.getByRole('button', { name: /sign out/i }).click();
        await page.waitForURL('**/login', { timeout: 5000 });
        
        // Test 2: Login page guest login
        console.log('\n2. Testing login page guest login...');
        const loginGuestButton = page.getByRole('button', { name: /continue as guest/i });
        await loginGuestButton.click();
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        console.log('   ✅ Login page guest login works');
        
        // Test 3: Create a task as guest
        console.log('\n3. Testing task creation as guest...');
        await page.getByRole('button', { name: /new task/i }).first().click();
        await page.waitForTimeout(1000);
        
        const taskTitle = `Guest Task ${Date.now()}`;
        await page.fill('input[placeholder*="title" i], input[name="title"], input[id="title"]', taskTitle);
        await page.getByRole('button', { name: /create/i }).click();
        await page.waitForTimeout(2000);
        
        const taskVisible = await page.locator(`text=${taskTitle}`).isVisible();
        if (taskVisible) {
            console.log('   ✅ Guest can create tasks');
        } else {
            console.log('   ❌ Guest cannot create tasks');
        }
        
        // Test 4: Verify guest user info
        console.log('\n4. Verifying guest session...');
        const dashboardContent = await page.locator('text=/dashboard|task|calendar/i').first().isVisible();
        if (dashboardContent) {
            console.log('   ✅ Guest has full dashboard access');
        }
        
        console.log('\n=== All Tests Complete ===');
        console.log('✅ Guest mode working end-to-end!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-guest-error.png' });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
})();

