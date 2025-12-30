const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing Monochrome Theme on Production ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testURL(path) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // Check for monochrome theme indicators
                const hasDarkClass = data.includes('class="dark"') || data.includes("className='dark'") || data.includes('className="dark"');
                const hasMonochromeColors = data.includes('#0b0b0b') || data.includes('#111') || data.includes('#f5f5f5') || data.includes('bg-[#');
                const hasNoColoredClasses = !data.includes('bg-indigo-') && !data.includes('bg-blue-') && !data.includes('bg-purple-') && !data.includes('text-indigo-') && !data.includes('text-blue-');
                const hasDarkBackground = data.includes('bg-[#0b0b0b]') || data.includes('bg-[#111]') || data.includes('background: #0b0b0b');
                
                console.log(`  ✓ Status: ${res.statusCode}`);
                console.log(`  ✓ Has dark class: ${hasDarkClass ? 'YES' : 'NO'}`);
                console.log(`  ✓ Has monochrome colors: ${hasMonochromeColors ? 'YES' : 'NO'}`);
                console.log(`  ✓ No colored classes: ${hasNoColoredClasses ? 'YES' : 'NO'}`);
                console.log(`  ✓ Dark background: ${hasDarkBackground ? 'YES' : 'NO'}`);
                
                resolve({
                    path,
                    status: res.statusCode,
                    hasDarkClass,
                    hasMonochromeColors,
                    hasNoColoredClasses,
                    hasDarkBackground
                });
            });
        }).on('error', (err) => {
            console.log(`  ✗ Error: ${err.message}`);
            reject(err);
        });
    });
}

async function runTests() {
    const paths = ['/', '/login', '/signup', '/pricing'];
    const results = [];
    
    for (const path of paths) {
        try {
            const result = await testURL(path);
            results.push(result);
            console.log('');
        } catch (err) {
            console.log(`  ✗ Failed to test ${path}\n`);
        }
    }
    
    console.log('=== Summary ===\n');
    const allPassed = results.every(r => 
        r.hasDarkClass && 
        r.hasMonochromeColors && 
        r.hasNoColoredClasses && 
        r.hasDarkBackground
    );
    
    if (allPassed) {
        console.log('✅ All pages have monochrome theme!');
    } else {
        console.log('⚠️  Some pages may need review');
    }
    
    console.log(`\nTested ${results.length} pages`);
    console.log(`\nVisit ${PRODUCTION_URL} to see the monochrome theme in action!`);
}

runTests().catch(console.error);

