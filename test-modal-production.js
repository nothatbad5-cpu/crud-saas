const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 800 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    
    console.log(`\n=== Testing Modal Fix on Production ===\n`);
    console.log(`URL: ${baseURL}\n`);
    
    try {
        // Login as guest
        console.log('1. Logging in as guest...');
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.getByRole('button', { name: /continue as guest/i }).click();
        await page.waitForURL('**/dashboard', { timeout: 5000 });
        console.log('   ✅ Guest login successful');
        
        await page.waitForTimeout(2000);
        
        // Check if modal is visible
        console.log('\n2. Checking onboarding modal...');
        const modalVisible = await page.locator('text=Welcome to TaskMaster').isVisible().catch(() => false);
        console.log(`   Modal visible: ${modalVisible}`);
        
        if (modalVisible) {
            // Try to click "Skip for now" button
            console.log('\n3. Clicking "Skip for now" button...');
            const skipButton = page.getByRole('button', { name: /skip for now/i });
            if (await skipButton.isVisible()) {
                await skipButton.click();
                await page.waitForTimeout(2000);
                const modalStillVisible = await page.locator('text=Welcome to TaskMaster').isVisible().catch(() => false);
                if (!modalStillVisible) {
                    console.log('   ✅ Modal dismissed successfully');
                } else {
                    console.log('   ❌ Modal still visible');
                }
            }
        }
        
        // Now test "New Task" button
        console.log('\n4. Testing "New Task" button...');
        await page.waitForTimeout(1000);
        const newTaskButton = page.getByRole('button', { name: /new task/i }).first();
        if (await newTaskButton.isVisible()) {
            await newTaskButton.click();
            await page.waitForTimeout(2000);
            const taskModalOpen = await page.locator('input[placeholder*="title" i], input[name="title"]').first().isVisible().catch(() => false);
            if (taskModalOpen) {
                console.log('   ✅ "New Task" button works - task modal opens');
            } else {
                console.log('   ⚠️  Task modal not opening');
            }
        } else {
            console.log('   ⚠️  "New Task" button not found');
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-modal-prod-error.png' });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
})();


