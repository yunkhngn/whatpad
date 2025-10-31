// Check the new token from the screenshot
const newToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJIb2FuZyIsImlhdCI6MTczMDA0NTc1N30.DfqC0sYYvlPGcMEFGNQXVGxFvGwNd8WDsLJrvfZEYZY";
const jwt = require('jsonwebtoken');

try {
    // Try to verify with the default secret
    const decoded = jwt.verify(newToken, 'supersecret');
    console.log('✅ Token verified successfully with "supersecret"!');
    console.log('Decoded payload:', decoded);
    console.log('User ID:', decoded.id);
    console.log('Username:', decoded.username);
    console.log('Issued at:', new Date(decoded.iat * 1000).toLocaleString());
    if (decoded.exp) {
        console.log('Expires at:', new Date(decoded.exp * 1000).toLocaleString());
        const now = Math.floor(Date.now() / 1000);
        console.log('Current time:', new Date(now * 1000).toLocaleString());
        if (now > decoded.exp) {
            console.log('❌ Token has EXPIRED');
        } else {
            console.log('✅ Token is still valid for', Math.floor((decoded.exp - now) / 60), 'minutes');
        }
    }
} catch (err) {
    console.log('❌ Token verification failed:', err.message);
    
    // Try decoding without verification
    const parts = newToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('\nPayload (unverified):', payload);
}
