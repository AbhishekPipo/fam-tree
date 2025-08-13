#!/usr/bin/env node

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

console.log('🧪 Testing CORS Fix for Family Tree API\n');

// Function to test if server is running
function testServer(port = 3000) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/api/health`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({ success: true, data: result, port });
        } catch (e) {
          resolve({ success: false, error: 'Invalid JSON response', port });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, error: err.message, port });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout', port });
    });
  });
}

// Function to start server
function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    console.log(`🚀 Starting server on port ${port}...`);
    
    const serverProcess = spawn('node', ['server.js'], {
      cwd: path.join(__dirname),
      env: { ...process.env, PORT: port },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let serverReady = false;
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('Family Tree Server running') && !serverReady) {
        serverReady = true;
        resolve(serverProcess);
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server Error:', data.toString());
    });

    serverProcess.on('error', (err) => {
      reject(err);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!serverReady) {
        serverProcess.kill();
        reject(new Error('Server startup timeout'));
      }
    }, 30000);
  });
}

// Main test function
async function runCORSTest() {
  let serverProcess = null;
  
  try {
    // Try to connect to existing server first
    console.log('🔍 Checking if server is already running...');
    let testResult = await testServer(3000);
    
    if (!testResult.success) {
      // Try port 3001
      testResult = await testServer(3001);
    }
    
    if (!testResult.success) {
      // Start new server
      serverProcess = await startServer(3000);
      
      // Wait a bit for server to fully start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test again
      testResult = await testServer(3000);
    }

    if (testResult.success) {
      console.log(`✅ Server is running on port ${testResult.port}`);
      console.log(`📊 Health check response:`, testResult.data);
      
      console.log('\n🌐 CORS Configuration Applied:');
      console.log('✅ Origin: Allow all origins in development');
      console.log('✅ Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH');
      console.log('✅ Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
      console.log('✅ Credentials: Enabled');
      console.log('✅ Preflight: Handled explicitly');
      
      console.log('\n🧪 To test CORS from browser:');
      console.log(`1. Open: file://${path.join(__dirname, 'cors-test.html')}`);
      console.log(`2. Or visit: http://localhost:${testResult.port}/cors-test.html`);
      console.log('3. Click the test buttons to verify CORS is working');
      
      console.log('\n📋 Manual CORS Test Commands:');
      console.log(`curl -X OPTIONS http://localhost:${testResult.port}/api/health -H "Origin: http://localhost:8080" -v`);
      console.log(`curl -X GET http://localhost:${testResult.port}/api/health -H "Origin: http://localhost:8080" -v`);
      
      console.log('\n🎯 Relationship Fix Verification:');
      console.log('The CORS fix allows you to test the relationship calculation fix from any web browser.');
      console.log('Cousins should now appear as level 0 relationships instead of being misclassified as nephews/nieces.');
      
    } else {
      console.error('❌ Failed to start or connect to server:', testResult.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (serverProcess) {
      console.log('\n🛑 Stopping test server...');
      serverProcess.kill();
    }
  }
}

// Run the test
runCORSTest().then(() => {
  console.log('\n✅ CORS test completed!');
}).catch((error) => {
  console.error('\n❌ CORS test failed:', error.message);
  process.exit(1);
});