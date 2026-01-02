const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false, slowMo: 1000 });
    const context = await browser.newContext();
    const page = await context.newPage();

    const consoleMessages = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        console.log(`CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    
    console.log(`\n=== Debugging Guest Login ===\n`);
    
    try {
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        await page.screenshot({ path: 'debug-guest-1-home.png' });
        
        // Check if home page shows guest button
        const guestButton = page.getByRole('button', { name: /continue as guest/i });
        const isVisible = await guestButton.isVisible();
        console.log(`Guest button visible: ${isVisible}`);
        
        if (!isVisible) {
            console.log('❌ Guest button not found on home page');
            return;
        }
        
        console.log('\nClicking guest button...');
        await guestButton.click();
        
        // Wait and check for errors
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'debug-guest-2-after-click.png' });
        
        const currentURL = page.url();
        console.log(`Current URL: ${currentURL}`);
        
        // Check console for errors
        const errors = consoleMessages.filter(m => m.type === 'error');
        if (errors.length > 0) {
            console.log('\nConsole errors:');
            errors.forEach(e => console.log(`  - ${e.text}`));
        }
        
        // Check for network errors
        page.on('response', response => {
            if (response.status() >= 400 && response.url().includes('auth')) {
                console.log(`\nAuth API Error: ${response.url()} - ${response.status()}`);
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await page.waitForTimeout(2000);
        await browser.close();
    }
})();


