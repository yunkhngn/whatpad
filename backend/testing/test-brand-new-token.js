// Test the BRAND NEW token from the latest screenshot
const brandNewToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJIb2FuZyIsImlhdCI6MTczMDA0NTc1N30.NzU2fQ.Dham2lrYLZ5DtzixC1jXHHobwXP4lQFnsd0mb1XoHJI";
const jwt = require('jsonwebtoken');

console.log('Testing BRAND NEW token...\n');

// Try with supersecret
try {
    const decoded = jwt.verify(brandNewToken, 'supersecret');
    console.log('✅ Token verified with "supersecret"!');
    console.log('Decoded:', decoded);
    
    if (decoded.exp) {
        const now = Math.floor(Date.now() / 1000);
        const remaining = decoded.exp - now;
        if (remaining > 0) {
            console.log(`✅ Token valid for ${Math.floor(remaining / 60)} minutes`);
        } else {
            console.log(`❌ Token EXPIRED ${Math.floor(-remaining / 60)} minutes ago`);
        }
    } else {
        console.log('⚠️  Token has NO expiration');
    }
} catch (err) {
    console.log('❌ Failed:', err.message);
    
    // Decode without verification
    console.log('\nPayload (unverified):');
    try {
        const parts = brandNewToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        console.log(payload);
        console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
        if (payload.exp) {
            console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
        }
    } catch (e) {
        console.log('Cannot decode:', e.message);
    }
}

// Test with the API endpoint
console.log('\n--- Testing with API endpoint ---');
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/reading/me/reading-history',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${brandNewToken}`
    }
};

const req = http.request(options, (res) => {
    console.log('Status:', res.statusCode);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('Response:', data);
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.log('Request error:', err.message);
    process.exit(1);
});

req.end();
