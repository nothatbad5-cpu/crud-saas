const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing Mobile UX Polish on Production ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testURL(path, description) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`\n📄 ${description}`);
        console.log(`   URL: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const checks = {
                    status: res.statusCode,
                    hasCompactNavbar: data.includes('h-12 md:h-16') || data.includes('sticky top-0'),
                    hasCompactTitle: data.includes('text-xl sm:text-2xl') || data.includes('text-2xl sm:text-3xl'),
                    hasOverflowHidden: data.includes('overflow-x-hidden'),
                    hasCompactPadding: data.includes('pt-8 pb-12') || data.includes('px-4 pt-8'),
                    hasRoundedXl: data.includes('rounded-xl sm:rounded-2xl'),
                    hasCompactTabs: data.includes('py-2 rounded-xl') && data.includes('grid grid-cols-2'),
                    hasCompactAgenda: data.includes('text-xs uppercase tracking-wide') || data.includes('uppercase tracking-wide'),
                    hasCompactButton: data.includes('h-11') && data.includes('text-sm'),
                    hasMinHeightSVH: data.includes('min-h-[100svh]'),
                    hasItemsStart: data.includes('items-start sm:items-center')
                };
                
                console.log(`   ✓ Status: ${checks.status}`);
                console.log(`   ✓ Compact navbar (h-12): ${checks.hasCompactNavbar ? '✅' : '❌'}`);
                console.log(`   ✓ Compact title: ${checks.hasCompactTitle ? '✅' : '❌'}`);
                console.log(`   ✓ Overflow hidden: ${checks.hasOverflowHidden ? '✅' : '❌'}`);
                console.log(`   ✓ Compact padding: ${checks.hasCompactPadding ? '✅' : '❌'}`);
                console.log(`   ✓ Responsive rounding: ${checks.hasRoundedXl ? '✅' : '❌'}`);
                console.log(`   ✓ Compact tabs: ${checks.hasCompactTabs ? '✅' : '❌'}`);
                console.log(`   ✓ Compact agenda: ${checks.hasCompactAgenda ? '✅' : '❌'}`);
                console.log(`   ✓ Compact button: ${checks.hasCompactButton ? '✅' : '❌'}`);
                console.log(`   ✓ min-h-[100svh]: ${checks.hasMinHeightSVH ? '✅' : '❌'}`);
                console.log(`   ✓ items-start: ${checks.hasItemsStart ? '✅' : '❌'}`);
                
                resolve({ path, description, ...checks });
            });
        }).on('error', (err) => {
            console.log(`   ✗ Error: ${err.message}`);
            reject(err);
        });
    });
}

async function runTests() {
    const tests = [
        { path: '/', description: 'Home Page' },
        { path: '/login', description: 'Login Page' },
        { path: '/signup', description: 'Signup Page' }
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await testURL(test.path, test.description);
            results.push(result);
        } catch (err) {
            console.log(`   ✗ Failed to test ${test.path}\n`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('=== SUMMARY ===\n');
    
    const allPassed = results.every(r => r.status === 200);
    const mobileFixes = {
        compactNavbar: results.some(r => r.hasCompactNavbar),
        compactTitle: results.some(r => r.hasCompactTitle),
        overflowHidden: results.some(r => r.hasOverflowHidden),
        compactPadding: results.some(r => r.hasCompactPadding),
        responsiveRounding: results.some(r => r.hasRoundedXl),
        minHeightSVH: results.some(r => r.hasMinHeightSVH),
        itemsStart: results.some(r => r.hasItemsStart)
    };
    
    console.log('Mobile UX Polish Status:');
    console.log(`  Compact navbar: ${mobileFixes.compactNavbar ? '✅' : '❌'}`);
    console.log(`  Compact title: ${mobileFixes.compactTitle ? '✅' : '❌'}`);
    console.log(`  Overflow hidden: ${mobileFixes.overflowHidden ? '✅' : '❌'}`);
    console.log(`  Compact padding: ${mobileFixes.compactPadding ? '✅' : '❌'}`);
    console.log(`  Responsive rounding: ${mobileFixes.responsiveRounding ? '✅' : '❌'}`);
    console.log(`  min-h-[100svh]: ${mobileFixes.minHeightSVH ? '✅' : '❌'}`);
    console.log(`  items-start: ${mobileFixes.itemsStart ? '✅' : '❌'}`);
    
    if (allPassed) {
        console.log('\n✅ All pages are accessible!');
        console.log('\n📱 Mobile Testing Instructions:');
        console.log('1. Visit https://crud-saas-three.vercel.app on mobile or use browser dev tools');
        console.log('2. Set viewport to 360px width (iPhone size)');
        console.log('3. Verify:');
        console.log('   - Login page starts near top (no giant gap)');
        console.log('   - Navbar is compact (h-12) and sticky');
        console.log('   - Dashboard title is smaller (text-xl)');
        console.log('   - Tabs are compact (py-2)');
        console.log('   - New Task button is h-11');
        console.log('   - Calendar shows agenda view (not grid)');
        console.log('   - No horizontal scrolling');
    } else {
        console.log('\n⚠️  Some pages may need review');
    }
    
    console.log(`\n🌐 Production URL: ${PRODUCTION_URL}`);
}

runTests().catch(console.error);


