const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const networkRequests = [];
    const networkErrors = [];
    
    // Capture all network requests
    page.on('request', request => {
        networkRequests.push({
            url: request.url(),
            method: request.method(),
            headers: request.headers()
        });
    });
    
    // Capture all responses
    page.on('response', async response => {
        const url = response.url();
        const status = response.status();
        
        if (status >= 400 || url.includes('signup') || url.includes('login')) {
            const body = await response.text().catch(() => '');
            networkErrors.push({
                url,
                status,
                statusText: response.statusText(),
                headers: response.headers(),
                body: body.substring(0, 500) // First 500 chars
            });
        }
    });

    const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://crud-saas-three.vercel.app';
    
    console.log(`\n=== Network Debug: ${baseURL} ===\n`);
    
    try {
        // Navigate to signup
        console.log('Navigating to signup...');
        await page.goto(`${baseURL}/signup`, { waitUntil: 'networkidle' });
        
        // Fill and submit
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = `TestPass${Date.now()}!`;
        
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);
        
        console.log('Submitting form...');
        await page.getByRole('button', { name: /sign up/i }).click();
        
        // Wait for response
        await page.waitForTimeout(5000);
        
        console.log('\n=== Network Errors ===');
        networkErrors.forEach((err, i) => {
            console.log(`\n${i + 1}. ${err.method || 'GET'} ${err.url}`);
            console.log(`   Status: ${err.status} ${err.statusText}`);
            if (err.body) {
                console.log(`   Body: ${err.body}`);
            }
        });
        
        // Check for server action requests
        const serverActions = networkRequests.filter(r => 
            r.url.includes('signup') || 
            r.url.includes('_next') ||
            r.method === 'POST'
        );
        
        console.log('\n=== Relevant Requests ===');
        serverActions.forEach((req, i) => {
            console.log(`${i + 1}. ${req.method} ${req.url}`);
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await browser.close();
    }
})();

