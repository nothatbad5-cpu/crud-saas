const https = require('https');

const PRODUCTION_URL = 'https://crud-saas-three.vercel.app';

console.log('\n=== Testing AI Command API Endpoints ===\n');
console.log(`Production URL: ${PRODUCTION_URL}\n`);

function testEndpoint(method, path, body, description) {
    return new Promise((resolve, reject) => {
        const url = `${PRODUCTION_URL}${path}`;
        console.log(`\n📡 ${description}`);
        console.log(`   ${method} ${url}`);
        
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const status = res.statusCode;
                let parsedData;
                try {
                    parsedData = JSON.parse(data);
                } catch (e) {
                    parsedData = { raw: data.substring(0, 100) };
                }
                
                console.log(`   ✓ Status: ${status}`);
                
                if (status === 401) {
                    console.log(`   ✓ Endpoint exists (requires auth - expected)`);
                } else if (status === 400) {
                    console.log(`   ✓ Endpoint exists (validation error - expected)`);
                } else if (status === 200 || status === 201) {
                    console.log(`   ✓ Endpoint works!`);
                } else {
                    console.log(`   ⚠️  Unexpected status: ${status}`);
                }
                
                if (parsedData.error) {
                    console.log(`   Response: ${parsedData.error}`);
                } else if (parsedData.actions) {
                    console.log(`   Response: Actions array with ${parsedData.actions.length} action(s)`);
                }
                
                resolve({ method, path, status, data: parsedData });
            });
        });
        
        req.on('error', (err) => {
            console.log(`   ✗ Error: ${err.message}`);
            reject(err);
        });
        
        if (body) {
            req.write(JSON.stringify(body));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('Testing API endpoints (will return 401 without auth, which confirms endpoints exist)...\n');
    
    const tests = [
        {
            method: 'POST',
            path: '/api/ai/task-command',
            body: { input: 'add buy milk' },
            description: 'AI Command Endpoint'
        },
        {
            method: 'POST',
            path: '/api/ai/task-command/confirm',
            body: { actions: [] },
            description: 'AI Command Confirm Endpoint'
        },
    ];
    
    const results = [];
    
    for (const test of tests) {
        try {
            const result = await testEndpoint(test.method, test.path, test.body, test.description);
            results.push(result);
        } catch (err) {
            console.log(`   ✗ Failed: ${err.message}\n`);
        }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('=== SUMMARY ===\n');
    
    const endpointsExist = results.every(r => r.status === 401 || r.status === 400 || r.status === 200);
    
    if (endpointsExist) {
        console.log('✅ API endpoints are deployed and accessible!');
        console.log('   (401/400 responses confirm endpoints exist, just need auth)');
    } else {
        console.log('⚠️  Some endpoints may not be deployed yet');
    }
    
    console.log('\n📱 Next Steps:');
    console.log('1. Visit https://crud-saas-three.vercel.app');
    console.log('2. Sign in or continue as guest');
    console.log('3. Go to Dashboard');
    console.log('4. Look for the AI command bar at the top');
    console.log('5. Test commands in the browser console or UI');
}

runTests().catch(console.error);


