// Test JWT token validation
// SECURITY: Never hardcode real tokens! Use environment variables or generate test tokens
const jwt = require('jsonwebtoken');

console.log('JWT Token Tester');
console.log('================\n');

// Get token from environment variable or command line argument
const testToken = process.env.TEST_JWT_TOKEN || process.argv[2];

if (!testToken) {
    console.log('❌ No token provided!');
    console.log('\nUsage:');
    console.log('  node test-latest-token.js <your-token>');
    console.log('  or');
    console.log('  TEST_JWT_TOKEN=<your-token> node test-latest-token.js');
    process.exit(1);
}

console.log('Testing provided token...\n');

// Try both possible secrets
const secrets = ['supersecret', process.env.JWT_SECRET];

for (const secret of secrets) {
    if (!secret) continue;
    
    try {
        const decoded = jwt.verify(testToken, secret);
        console.log(`✅ Token verified with secret: "${secret}"`);
        console.log('Decoded:', decoded);
        
        if (decoded.exp) {
            const now = Math.floor(Date.now() / 1000);
            const remaining = decoded.exp - now;
            if (remaining > 0) {
                console.log(`✅ Token expires in ${Math.floor(remaining / 60)} minutes`);
            } else {
                console.log(`❌ Token EXPIRED ${Math.floor(-remaining / 60)} minutes ago`);
            }
        } else {
            console.log('⚠️  Token has NO expiration');
        }
        break;
    } catch (err) {
        console.log(`❌ Failed with secret "${secret}":`, err.message);
    }
}

// Decode without verification to see payload
console.log('\nPayload (unverified):');
const parts = testToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log(payload);
console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
if (payload.exp) {
    console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
}
