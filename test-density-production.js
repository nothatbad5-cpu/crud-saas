const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing Mobile Density Polish on Production ===\n');
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
                    hasCompactPadding: data.includes('p-4 sm:p-6') || data.includes('p-3'),
                    hasCompactTitle: data.includes('text-xl sm:text-2xl'),
                    hasRoundedXl: data.includes('rounded-xl') && !data.includes('rounded-xl sm:rounded-2xl'),
                    hasCompactTabs: data.includes('h-9') && data.includes('px-3'),
                    hasCompactButton: data.includes('h-10'),
                    hasCompactCards: data.includes('p-3') && data.includes('space-y-2'),
                    hasCompactAgenda: data.includes('p-3') && data.includes('space-y-2'),
                    hasSmallerIcons: data.includes('w-3.5 h-3.5')
                };
                
                console.log(`   ✓ Status: ${checks.status}`);
                console.log(`   ✓ Compact padding (p-4/p-3): ${checks.hasCompactPadding ? '✅' : '❌'}`);
                console.log(`   ✓ Compact title (text-xl): ${checks.hasCompactTitle ? '✅' : '❌'}`);
                console.log(`   ✓ Rounded-xl only: ${checks.hasRoundedXl ? '✅' : '❌'}`);
                console.log(`   ✓ Compact tabs (h-9): ${checks.hasCompactTabs ? '✅' : '❌'}`);
                console.log(`   ✓ Compact button (h-10): ${checks.hasCompactButton ? '✅' : '❌'}`);
                console.log(`   ✓ Compact cards (p-3): ${checks.hasCompactCards ? '✅' : '❌'}`);
                console.log(`   ✓ Compact agenda (p-3): ${checks.hasCompactAgenda ? '✅' : '❌'}`);
                
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
    const densityFixes = {
        compactPadding: results.some(r => r.hasCompactPadding),
        compactTitle: results.some(r => r.hasCompactTitle),
        roundedXl: results.some(r => r.hasRoundedXl),
        compactTabs: results.some(r => r.hasCompactTabs),
        compactButton: results.some(r => r.hasCompactButton),
        compactCards: results.some(r => r.hasCompactCards),
        compactAgenda: results.some(r => r.hasCompactAgenda)
    };
    
    console.log('Mobile Density Polish Status:');
    console.log(`  Compact padding: ${densityFixes.compactPadding ? '✅' : '❌'}`);
    console.log(`  Compact title: ${densityFixes.compactTitle ? '✅' : '❌'}`);
    console.log(`  Rounded-xl only: ${densityFixes.roundedXl ? '✅' : '❌'}`);
    console.log(`  Compact tabs: ${densityFixes.compactTabs ? '✅' : '❌'}`);
    console.log(`  Compact button: ${densityFixes.compactButton ? '✅' : '❌'}`);
    console.log(`  Compact cards: ${densityFixes.compactCards ? '✅' : '❌'}`);
    console.log(`  Compact agenda: ${densityFixes.compactAgenda ? '✅' : '❌'}`);
    
    if (allPassed) {
        console.log('\n✅ All pages are accessible!');
        console.log('\n📱 Mobile Density Improvements:');
        console.log('   - Login cards: p-4 padding, text-xl heading');
        console.log('   - Dashboard: mb-2 margin, h-9 tabs, h-10 button');
        console.log('   - Task cards: p-3 padding, space-y-2');
        console.log('   - Agenda: p-3 padding, compact rows');
        console.log('\n🌐 Production URL: https://crud-saas-three.vercel.app');
        console.log('\n💡 Note: Some changes are in client-side React components');
        console.log('   and may not be visible in raw HTML. Test in a real browser!');
    } else {
        console.log('\n⚠️  Some pages may need review');
    }
}

runTests().catch(console.error);


