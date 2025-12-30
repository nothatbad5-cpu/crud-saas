const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing Mobile UI on Production ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testURL(path) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                // Check for mobile UI indicators
                const hasMobileMenu = data.includes('md:hidden') || data.includes('hidden md:');
                const hasMobileCards = data.includes('block md:hidden') || data.includes('hidden md:block');
                const hasResponsivePadding = data.includes('px-3 sm:px-6') || data.includes('px-3');
                const hasAgendaView = data.includes('agenda') || data.includes('Today') || data.includes('Tomorrow');
                const shortcutsHidden = data.includes('hidden md:block') && data.includes('Shortcuts');
                
                console.log(`  ✓ Status: ${res.statusCode}`);
                console.log(`  ✓ Has mobile menu: ${hasMobileMenu ? 'YES' : 'NO'}`);
                console.log(`  ✓ Has responsive cards: ${hasMobileCards ? 'YES' : 'NO'}`);
                console.log(`  ✓ Has responsive padding: ${hasResponsivePadding ? 'YES' : 'NO'}`);
                console.log(`  ✓ Shortcuts hidden on mobile: ${shortcutsHidden ? 'YES' : 'NO'}`);
                
                resolve({
                    path,
                    status: res.statusCode,
                    hasMobileMenu,
                    hasMobileCards,
                    hasResponsivePadding,
                    shortcutsHidden
                });
            });
        }).on('error', (err) => {
            console.log(`  ✗ Error: ${err.message}`);
            reject(err);
        });
    });
}

async function runTests() {
    const paths = ['/', '/login', '/dashboard'];
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
        r.hasMobileMenu && 
        r.hasResponsivePadding
    );
    
    if (allPassed) {
        console.log('✅ Mobile UI improvements detected!');
    } else {
        console.log('⚠️  Some mobile UI features may need review');
    }
    
    console.log(`\nTested ${results.length} pages`);
    console.log(`\n📱 Mobile Testing Instructions:`);
    console.log(`1. Visit ${PRODUCTION_URL} on a mobile device or use browser dev tools`);
    console.log(`2. Check that:`);
    console.log(`   - Navbar has hamburger menu (☰) on mobile`);
    console.log(`   - Dashboard header is stacked (title → tabs → button)`);
    console.log(`   - Table view shows as cards on mobile`);
    console.log(`   - Calendar view shows as agenda list on mobile`);
    console.log(`   - No horizontal scrolling on 360px width`);
    console.log(`   - Shortcuts overlay is hidden on mobile`);
}

runTests().catch(console.error);

