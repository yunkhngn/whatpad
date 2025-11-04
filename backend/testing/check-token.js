// Quick script to decode JWT token and check expiration

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NiwidXNlcm5hbWUiOiJIb2FuZyIsImlhdCI6MTczMDA0NTc1N30.DfqC0sYYvlPGcMEFGNQXVGxFvGwNd8WDsLJrvfZEYZY";

try {
    // Decode JWT without verification (just to see the payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
        console.log('Invalid token format');
        process.exit(1);
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('Token payload:', payload);
    console.log('\nToken details:');
    console.log('  User ID:', payload.id);
    console.log('  Username:', payload.username);
    console.log('  Issued at:', new Date(payload.iat * 1000).toLocaleString());
    
    if (payload.exp) {
        console.log('  Expires at:', new Date(payload.exp * 1000).toLocaleString());
        const now = Date.now() / 1000;
        if (now > payload.exp) {
            console.log('\n❌ Token has EXPIRED');
        } else {
            console.log('\n✅ Token is still valid');
        }
    } else {
        console.log('  Expires at: Never (no expiration set)');
        console.log('\n✅ Token does not expire');
    }

} catch (error) {
    console.error('Error decoding token:', error.message);
}
