// Test the brand new token from the latest screenshot
const newestToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJIb2FuZyIsImlhdCI6MTczMDA0NTc1N30.DfqC0sYYvlPGcMEFGNQXVGxFvGwNd8WDsLJrvfZEYZY";
const jwt = require('jsonwebtoken');

console.log('Testing newest token from screenshot...\n');

// Try both possible secrets
const secrets = ['supersecret', process.env.JWT_SECRET];

for (const secret of secrets) {
    if (!secret) continue;
    
    try {
        const decoded = jwt.verify(newestToken, secret);
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
const parts = newestToken.split('.');
const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
console.log(payload);
console.log('Issued at:', new Date(payload.iat * 1000).toLocaleString());
if (payload.exp) {
    console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
}
