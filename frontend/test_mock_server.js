import fetch from 'node-fetch';
import { spawn } from 'child_process';
import fs from 'fs';
import FormData from 'form-data';

async function runTests() {
  let mockServerProcess;
  try {
    // Start mock server in background
    console.log('Starting mock server...');
    mockServerProcess = spawn('node', ['mock-server.js'], { cwd: './frontend', detached: true });

    mockServerProcess.stdout.on('data', (data) => {
      console.log(`Mock Server Stdout: ${data}`);
    });

    mockServerProcess.stderr.on('data', (data) => {
      console.error(`Mock Server Stderr: ${data}`);
    });

    // Wait for server to start (give it some time)
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log('Testing /api/register...');
    const registerFormData = new FormData();
    registerFormData.append('image', fs.createReadStream('./frontend/test_image.jpg'), 'test_image.jpg');

    const registerResponse = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      body: registerFormData,
    });
    const registerData = await registerResponse.json();
    console.log('Register Response:', registerData);
    if (!registerData.uuid) {
      throw new Error('Register API did not return UUID');
    }
    console.log('Register API test passed.');

    console.log('Testing /api/oracle...');
    const oracleFormData = new FormData();
    oracleFormData.append('reference_uuid', registerData.uuid);
    oracleFormData.append('image', fs.createReadStream('./frontend/test_image.jpg'), 'test_image.jpg');
    oracleFormData.append('config', JSON.stringify({ type: 'Male' }));

    const oracleResponse = await fetch('http://localhost:3001/api/oracle', {
      method: 'POST',
      body: oracleFormData,
    });
    const oracleData = await oracleResponse.json();
    console.log('Oracle Response:', oracleData);
    if (!oracleData.message || typeof oracleData.point !== 'number') {
      throw new Error('Oracle API did not return message or point');
    }
    console.log('Oracle API test passed.');

    console.log('All mock server tests passed!');

  } catch (error) {
    console.error('Mock server test failed:', error);
    process.exit(1);
  } finally {
    if (mockServerProcess) {
      console.log('Stopping mock server...');
      process.kill(-mockServerProcess.pid); // Kill the process group
      console.log('Mock server stopped.');
    }
    // Clean up dummy image
    fs.unlinkSync('./frontend/test_image.jpg');
    console.log('Cleaned up test_image.jpg');
  }
}

runTests();
