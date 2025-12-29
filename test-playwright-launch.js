// Minimal Playwright browser launch test using @playwright/test
const { chromium } = require('@playwright/test');

(async () => {
    console.log('Starting Chromium launch test...');
    console.log('Node version:', process.version);
    console.log('Platform:', process.platform);
    console.log('Arch:', process.arch);

    try {
        console.log('\n1. Attempting to launch Chromium...');
        const browser = await chromium.launch({
            headless: true,
            timeout: 30000
        });

        console.log('✅ Chromium launched successfully!');

        console.log('\n2. Creating browser context...');
        const context = await browser.newContext();
        console.log('✅ Context created!');

        console.log('\n3. Creating new page...');
        const page = await context.newPage();
        console.log('✅ Page created successfully!');

        console.log('\n4. Closing browser...');
        await browser.close();
        console.log('✅ Browser closed successfully!');

        console.log('\n🎉 All tests passed! Playwright is working correctly.');

    } catch (error) {
        console.error('\n❌ Browser launch failed!');
        console.error('\n=== ERROR DETAILS ===');
        console.error('Name:', error.name);
        console.error('Message:', error.message);
        if (error.code) console.error('Code:', error.code);
        if (error.errno) console.error('Errno:', error.errno);
        if (error.syscall) console.error('Syscall:', error.syscall);
        console.error('\n=== FULL STACK ===');
        console.error(error.stack);
        process.exit(1);
    }
})();
