const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 800 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n=== Testing Theme Visual Change ===\n`);
    console.log(`URL: ${baseURL}\n`);
    
    try {
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        // Get initial background color
        console.log('1. Checking initial state...');
        const initialBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        const initialHasDark = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark');
        });
        console.log(`   Initial background: ${initialBg}`);
        console.log(`   Dark class: ${initialHasDark}`);
        
        // Click toggle
        console.log('\n2. Clicking theme toggle...');
        const toggleButton = page.locator('button[aria-label*="Switch"]');
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        // Check after toggle
        const afterToggleBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        const afterToggleHasDark = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark');
        });
        console.log(`   Background after toggle: ${afterToggleBg}`);
        console.log(`   Dark class after toggle: ${afterToggleHasDark}`);
        
        // Check if visual change occurred
        const bgChanged = initialBg !== afterToggleBg;
        if (bgChanged) {
            console.log('   ✅ Visual change detected! Background color changed.');
        } else {
            console.log('   ❌ No visual change - background color unchanged');
            console.log(`   Initial: ${initialBg}, After: ${afterToggleBg}`);
        }
        
        // Toggle back
        console.log('\n3. Toggling back...');
        await toggleButton.click();
        await page.waitForTimeout(500);
        
        const finalBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        const finalHasDark = await page.evaluate(() => {
            return document.documentElement.classList.contains('dark');
        });
        console.log(`   Final background: ${finalBg}`);
        console.log(`   Dark class: ${finalHasDark}`);
        
        const backToOriginal = initialBg === finalBg || 
            (initialBg.includes('rgb(255, 255, 255)') && finalBg.includes('rgb(255, 255, 255)')) ||
            (initialBg.includes('rgb(11, 11, 11)') && finalBg.includes('rgb(11, 11, 11)'));
        
        if (backToOriginal) {
            console.log('   ✅ Toggle works both ways');
        }
        
        // Test on login page
        console.log('\n4. Testing on login page...');
        await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1000);
        
        const loginBg = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        console.log(`   Login page background: ${loginBg}`);
        
        const loginToggle = page.locator('button[aria-label*="Switch"]');
        await loginToggle.click();
        await page.waitForTimeout(500);
        
        const loginBgAfter = await page.evaluate(() => {
            return window.getComputedStyle(document.body).backgroundColor;
        });
        const loginBgChanged = loginBg !== loginBgAfter;
        
        if (loginBgChanged) {
            console.log(`   ✅ Visual change on login page: ${loginBgAfter}`);
        } else {
            console.log(`   ❌ No visual change on login page`);
        }
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-theme-visual-error.png' });
    } finally {
        await page.waitForTimeout(3000);
        await browser.close();
    }
})();


