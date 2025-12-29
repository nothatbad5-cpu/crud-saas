const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n=== Testing Modal Fix ===\n`);
    console.log(`URL: ${baseURL}\n`);
    
    try {
        // Login as guest
        console.log('1. Logging in as guest...');
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: /continue as guest/i }).click();
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        console.log('   ✅ Guest login successful');
        
        // Wait for modal to appear
        await page.waitForTimeout(1000);
        
        // Test 1: Click backdrop to dismiss
        console.log('\n2. Testing backdrop click to dismiss modal...');
        const backdrop = page.locator('.fixed.inset-0.bg-gray-500').first();
        if (await backdrop.isVisible()) {
            await backdrop.click();
            await page.waitForTimeout(1000);
            const modalVisible = await page.locator('text=Welcome to TaskMaster').isVisible().catch(() => false);
            if (!modalVisible) {
                console.log('   ✅ Backdrop click dismisses modal');
            } else {
                console.log('   ❌ Modal still visible after backdrop click');
            }
        } else {
            console.log('   ⚠️  Modal not visible (may have auto-dismissed)');
        }
        
        // Test 2: Try to click "New Task" button
        console.log('\n3. Testing "New Task" button click...');
        await page.waitForTimeout(1000);
        const newTaskButton = page.getByRole('button', { name: /new task/i }).first();
        if (await newTaskButton.isVisible()) {
            await newTaskButton.click();
            await page.waitForTimeout(1000);
            const modalOpen = await page.locator('input[placeholder*="title" i], input[name="title"]').first().isVisible().catch(() => false);
            if (modalOpen) {
                console.log('   ✅ "New Task" button works - modal opens');
            } else {
                console.log('   ❌ Task creation modal not opening');
            }
        } else {
            console.log('   ⚠️  "New Task" button not found');
        }
        
        // Test 3: Try to click "Sign out" button
        console.log('\n4. Testing "Sign out" button click...');
        await page.waitForTimeout(1000);
        const signOutButton = page.getByRole('button', { name: /sign out/i });
        if (await signOutButton.isVisible()) {
            await signOutButton.click();
            await page.waitForTimeout(2000);
            const currentURL = page.url();
            if (currentURL.includes('/login')) {
                console.log('   ✅ "Sign out" button works');
            } else {
                console.log(`   ⚠️  Sign out redirect: ${currentURL}`);
            }
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-modal-fix-error.png' });
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
})();

