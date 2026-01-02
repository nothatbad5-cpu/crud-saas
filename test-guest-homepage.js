const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 500 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n=== Testing Guest Login on Home Page ===\n`);
    console.log(`URL: ${baseURL}\n`);
    
    try {
        // Step 1: Navigate to home page
        console.log('1. Navigating to home page...');
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'test-home-1-landing.png' });
        
        // Check if guest button is visible
        const guestButton = page.getByRole('button', { name: /continue as guest/i });
        const isGuestButtonVisible = await guestButton.isVisible();
        console.log(`   Guest button visible: ${isGuestButtonVisible}`);
        
        if (!isGuestButtonVisible) {
            console.log('   ❌ Guest button not found!');
            const pageContent = await page.textContent('body');
            console.log('   Page content:', pageContent?.substring(0, 200));
            await browser.close();
            return;
        }
        
        // Check if "Get Started" button is visible
        const getStartedLink = page.getByRole('link', { name: /get started/i });
        const isGetStartedVisible = await getStartedLink.isVisible();
        console.log(`   Get Started button visible: ${isGetStartedVisible}`);
        
        // Step 2: Click guest button
        console.log('\n2. Clicking "Continue as Guest" button...');
        await guestButton.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-home-2-after-click.png' });
        
        // Step 3: Check if redirected to dashboard
        const currentURL = page.url();
        console.log(`   Current URL: ${currentURL}`);
        
        if (currentURL.includes('/dashboard')) {
            console.log('   ✅ SUCCESS: Redirected to dashboard!');
            
            // Step 4: Verify dashboard loads
            console.log('\n3. Verifying dashboard...');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'test-home-3-dashboard.png' });
            
            const dashboardHeading = await page.locator('text=/dashboard/i').first().isVisible().catch(() => false);
            if (dashboardHeading) {
                console.log('   ✅ Dashboard is visible!');
            }
            
            // Step 5: Check if user is authenticated (check for tasks or other dashboard content)
            const hasDashboardContent = await page.locator('text=/task|table|calendar/i').first().isVisible().catch(() => false);
            console.log(`   Dashboard content visible: ${hasDashboardContent}`);
            
        } else if (currentURL.includes('error')) {
            const errorMsg = await page.locator('text=/error/i').first().textContent().catch(() => 'Unknown error');
            console.log(`   ❌ ERROR: ${errorMsg}`);
        } else {
            console.log(`   ⚠️  Unexpected URL: ${currentURL}`);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'test-home-error.png' });
    } finally {
        console.log('\n=== Screenshots saved ===');
        console.log('Check: test-home-*.png files');
        console.log('\nBrowser will close in 5 seconds...');
        await page.waitForTimeout(5000);
        await browser.close();
    }
})();


