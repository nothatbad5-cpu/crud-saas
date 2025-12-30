const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing Dark Theme Deployment ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testURL(path) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const hasDarkClass = data.includes('class="dark"') || data.includes("className='dark'") || data.includes('className="dark"');
                const hasThemeToggle = data.includes('ThemeToggleFab') || data.includes('theme-toggle') || data.includes('Switch to');
                const hasThemeScript = data.includes('theme-init') || data.includes('beforeInteractive') || data.includes('localStorage.getItem(\'theme\')');
                const hasDarkBackground = data.includes('#0b0b0b') || data.includes('background: #0b0b0b');
                
                resolve({
                    status: res.statusCode,
                    hasDarkClass,
                    hasThemeToggle,
                    hasThemeScript,
                    hasDarkBackground,
                    url: path
                });
            });
        }).on('error', (err) => {
            reject({ error: err.message, url: path });
        });
    });
}

async function runTests() {
    const pages = [
        '/',
        '/login',
        '/signup',
        '/dashboard'
    ];
    
    const results = [];
    
    for (const page of pages) {
        try {
            const result = await testURL(page);
            results.push(result);
            
            console.log(`  Status: ${result.status}`);
            console.log(`  Has dark class: ${result.hasDarkClass ? '✅' : '❌'}`);
            console.log(`  No theme toggle: ${!result.hasThemeToggle ? '✅' : '❌'}`);
            console.log(`  No theme script: ${!result.hasThemeScript ? '✅' : '❌'}`);
            console.log(`  Has dark background: ${result.hasDarkBackground ? '✅' : '❌'}`);
            console.log('');
        } catch (err) {
            console.log(`  ❌ Error: ${err.error || err.message}`);
            console.log('');
            results.push({ error: err, url: page });
        }
    }
    
    console.log('\n=== Summary ===\n');
    const allPassed = results.every(r => 
        !r.error && 
        r.status === 200 && 
        r.hasDarkClass && 
        !r.hasThemeToggle && 
        !r.hasThemeScript
    );
    
    if (allPassed) {
        console.log('✅ All tests passed! Dark theme is enforced globally.');
    } else {
        console.log('❌ Some tests failed. Check details above.');
    }
    
    console.log('\n=== Next Steps ===\n');
    console.log('1. Open production URL in browser:');
    console.log(`   ${PRODUCTION_URL}`);
    console.log('\n2. Verify manually:');
    console.log('   - Dark background (#0b0b0b) visible');
    console.log('   - No theme toggle button');
    console.log('   - No React errors in console');
    console.log('   - All pages use dark theme');
    console.log('\n3. Check browser console for errors:');
    console.log('   - Open DevTools (F12)');
    console.log('   - Check Console tab');
    console.log('   - Look for React error #418 or any other errors');
}

runTests().catch(console.error);

