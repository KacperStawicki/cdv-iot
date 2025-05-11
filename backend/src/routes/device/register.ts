#!/usr/bin/env node
/**
 * Script for registering a new device
 *
 * Usage:
 *   node register-device.js [deviceId]
 */

import http from 'http';

// Command configuration
const deviceId =
  process.argv[2] ||
  `device-${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;

// Create request data
const requestData = {
  deviceId,
};

console.log(`Registering device ${deviceId}...`);

// Convert data to JSON string
const jsonData = JSON.stringify(requestData);

// HTTP request options
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/device/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonData),
  },
};

// Send the request
const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);

  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    try {
      const parsedData = JSON.parse(responseData);
      console.log('Device registered successfully:');
      console.log('Device ID:      ', parsedData.deviceId);
      console.log('Auth Key:       ', parsedData.authKey);
      console.log(
        '\nSave these values! You will need them to configure your device and claim it from the web interface.'
      );
      console.log(`\nTo run the device simulation:`);
      console.log(
        `node continuous-monitor.js ${parsedData.deviceId} ${parsedData.authKey} 5`
      );
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', responseData);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request error:', error.message);
});

// Write data and end request
req.write(jsonData);
req.end();
