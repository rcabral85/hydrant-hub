const axios = require('axios');

async function testBackendLogin() {
    try {
        console.log('Testing backend login endpoint...\n');

        const response = await axios.post('http://localhost:5000/api/auth/login', {
            identifier: 'rcabral85@gmail.com',
            password: 'password123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Login successful!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
        console.log('❌ Login failed!');
        console.log('Status:', error.response?.status);
        console.log('Error:', error.response?.data);
        console.log('Full error:', error.message);
    }
}

testBackendLogin();
