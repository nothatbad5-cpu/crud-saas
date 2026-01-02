const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Listen to console messages
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    
    // Listen to page errors
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // Listen to network requests
    page.on('response', response => {
        if (response.status() >= 400) {
            console.log(`NETWORK ERROR: ${response.url()} - ${response.status()}`);
        }
    });

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    
    console.log(`\n=== Testing Production: ${baseURL} ===\n`);
    
    try {
        // Navigate to signup page
        console.log('1. Navigating to signup page...');
        await page.goto(`${baseURL}/signup`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'debug-1-signup-page.png' });
        console.log('   ✓ Signup page loaded');
        
        // Check for error messages
        const errorText = await page.locator('text=/error/i').first().textContent().catch(() => null);
        if (errorText) {
            console.log(`   ⚠️  Error visible: ${errorText}`);
        }
        
        // Fill signup form
        console.log('2. Filling signup form...');
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = `TestPass${Date.now()}!`;
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        await page.screenshot({ path: 'debug-2-form-filled.png' });
        console.log(`   ✓ Form filled with: ${testEmail}`);
        
        // Submit form
        console.log('3. Submitting form...');
        await page.getByRole('button', { name: /sign up/i }).click();
        
        // Wait for navigation or error
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'debug-3-after-submit.png' });
        
        const currentURL = page.url();
        console.log(`   Current URL: ${currentURL}`);
        
        // Check if we're on dashboard or error page
        if (currentURL.includes('/dashboard')) {
            console.log('   ✅ SUCCESS: Redirected to dashboard!');
        } else if (currentURL.includes('error')) {
            const errorMsg = await page.locator('text=/error/i').first().textContent().catch(() => 'Unknown error');
            console.log(`   ❌ ERROR: ${errorMsg}`);
            console.log(`   Full URL: ${currentURL}`);
        } else {
            console.log(`   ⚠️  Unexpected URL: ${currentURL}`);
        }
        
        // Check for any visible error messages
        const allErrors = await page.locator('text=/error|invalid|failed/i').allTextContents();
        if (allErrors.length > 0) {
            console.log('\n   Visible error messages:');
            allErrors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
        }
        
        // Check console for errors
        console.log('\n=== Waiting 5 seconds to capture any async errors ===');
        await page.waitForTimeout(5000);
        await page.screenshot({ path: 'debug-4-final-state.png' });
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        await page.screenshot({ path: 'debug-error.png' });
    } finally {
        console.log('\n=== Screenshots saved ===');
        console.log('Check: debug-1-signup-page.png');
        console.log('Check: debug-2-form-filled.png');
        console.log('Check: debug-3-after-submit.png');
        console.log('Check: debug-4-final-state.png');
        
        await browser.close();
    }
})();


