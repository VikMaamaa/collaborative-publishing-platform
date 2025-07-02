const https = require('https');
const http = require('http');

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ status: res.statusCode, data: jsonBody });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testLogin() {
  console.log('Testing login functionality...\n');
  
  // Step 1: Register a new user
  console.log('1. Registering new user...');
  const registerData = {
    email: 'logintest2@example.com',
    username: 'logintest2',
    password: 'LoginTest123',
    firstName: 'Login',
    lastName: 'Test2'
  };
  
  try {
    const registerResponse = await makeRequest('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, registerData);
    
    console.log('Register response:', registerResponse.status, registerResponse.data);
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ Registration successful');
      
      // Step 2: Try to login with the same credentials
      console.log('\n2. Testing login...');
      const loginData = {
        email: 'logintest2@example.com',
        password: 'LoginTest123'
      };
      
      const loginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, loginData);
      
      console.log('Login response:', loginResponse.status, loginResponse.data);
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful');
        
        // Step 3: Test with wrong password
        console.log('\n3. Testing login with wrong password...');
        const wrongLoginData = {
          email: 'logintest2@example.com',
          password: 'WrongPassword123'
        };
        
        const wrongLoginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }, wrongLoginData);
        
        console.log('Wrong password response:', wrongLoginResponse.status, wrongLoginResponse.data);
        
        if (wrongLoginResponse.status === 401) {
          console.log('✅ Wrong password correctly rejected');
        } else {
          console.log('❌ Wrong password should have been rejected');
        }
        
      } else {
        console.log('❌ Login failed');
      }
      
    } else {
      console.log('❌ Registration failed');
    }
    
    // Step 4: Test login with existing user
    console.log('\n4. Testing login with existing user...');
    const existingLoginData = {
      email: 'logintest@example.com',
      password: 'LoginTest123'
    };
    
    const existingLoginResponse = await makeRequest('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, existingLoginData);
    
    console.log('Existing user login response:', existingLoginResponse.status, existingLoginResponse.data);
    
    if (existingLoginResponse.status === 200) {
      console.log('✅ Existing user login successful');
    } else {
      console.log('❌ Existing user login failed');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testLogin();

const data = JSON.stringify({
  email: 'debugtest@example.com',
  password: 'password123'
});

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end(); 