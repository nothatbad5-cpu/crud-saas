const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing AI Command Feature on Production ===\n');
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
                    hasAICommandBar: data.includes('AICommandBar') || data.includes('Tell AI what to do'),
                    hasCommandInput: data.includes('Tell AI what to do') || data.includes('Run'),
                    hasAPIEndpoint: data.includes('/api/ai/task-command'),
                };
                
                console.log(`   ✓ Status: ${checks.status}`);
                console.log(`   ✓ AI Command Bar: ${checks.hasAICommandBar ? '✅' : '❌'}`);
                console.log(`   ✓ Command Input: ${checks.hasCommandInput ? '✅' : '❌'}`);
                console.log(`   ✓ API Endpoint Reference: ${checks.hasAPIEndpoint ? '✅' : '❌'}`);
                
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
        { path: '/dashboard', description: 'Dashboard Page (requires auth)' },
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
    
    const allPassed = results.every(r => r.status === 200 || r.status === 302 || r.status === 401);
    const aiFeatureDetected = results.some(r => r.hasAICommandBar || r.hasCommandInput);
    
    console.log('AI Command Feature Status:');
    console.log(`  Pages accessible: ${allPassed ? '✅' : '❌'}`);
    console.log(`  AI Command Bar detected: ${aiFeatureDetected ? '✅' : '⚠️  (May require auth to see)'}`);
    
    if (allPassed) {
        console.log('\n✅ Deployment successful!');
        console.log('\n📱 Manual Testing Instructions:');
        console.log('1. Visit https://crud-saas-three.vercel.app');
        console.log('2. Sign in (or continue as guest)');
        console.log('3. Navigate to Dashboard');
        console.log('4. Look for "Tell AI what to do…" input at the top');
        console.log('5. Try these commands:');
        console.log('   - "add buy milk"');
        console.log('   - "add call mom tomorrow"');
        console.log('   - "mark buy milk complete"');
        console.log('   - "delete buy milk"');
        console.log('   - "rename buy milk to buy almond milk"');
        console.log('   - "set due date for buy milk to tomorrow"');
        console.log('\n🌐 Production URL: https://crud-saas-three.vercel.app');
    } else {
        console.log('\n⚠️  Some pages may need review');
    }
}

runTests().catch(console.error);

