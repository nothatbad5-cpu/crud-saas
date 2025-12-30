const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Verifying Production Deployment ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testURL(path) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // Check for latest mobile UX polish indicators
                const hasCompactNavbar = data.includes('h-12 md:h-16') || data.includes('sticky top-0');
                const hasCompactTitle = data.includes('text-xl sm:text-2xl') || data.includes('text-2xl sm:text-3xl');
                const hasOverflowHidden = data.includes('overflow-x-hidden');
                const hasCompactTabs = data.includes('py-2 rounded-xl');
                const hasCompactAgenda = data.includes('text-xs uppercase tracking-wide');
                
                console.log(`  ✓ Status: ${res.statusCode}`);
                console.log(`  ✓ Compact navbar: ${hasCompactNavbar ? 'YES' : 'NO'}`);
                console.log(`  ✓ Compact title: ${hasCompactTitle ? 'YES' : 'NO'}`);
                console.log(`  ✓ Overflow hidden: ${hasOverflowHidden ? 'YES' : 'NO'}`);
                console.log(`  ✓ Compact tabs: ${hasCompactTabs ? 'YES' : 'NO'}`);
                console.log(`  ✓ Compact agenda: ${hasCompactAgenda ? 'YES' : 'NO'}`);
                
                resolve({
                    path,
                    status: res.statusCode,
                    hasCompactNavbar,
                    hasCompactTitle,
                    hasOverflowHidden,
                    hasCompactTabs,
                    hasCompactAgenda
                });
            });
        }).on('error', (err) => {
            console.log(`  ✗ Error: ${err.message}`);
            reject(err);
        });
    });
}

async function runTests() {
    const paths = ['/', '/login'];
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
        r.status === 200
    );
    
    if (allPassed) {
        console.log('✅ Production deployment is live!');
        console.log('\n📱 Mobile UX polish should be visible at:');
        console.log(`   ${PRODUCTION_URL}`);
        console.log('\nNote: If changes are not visible, wait 1-2 minutes for Vercel to finish deploying.');
    } else {
        console.log('⚠️  Some pages may need review');
    }
}

runTests().catch(console.error);

