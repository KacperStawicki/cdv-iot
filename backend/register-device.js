const http = require('http');

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

// HTTP request options - using the Docker container's port mapping
const options = {
  hostname: 'localhost',
  port: 8080, // Make sure this matches your Docker port mapping
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
    if (res.statusCode >= 400) {
      console.error('Server Error:', responseData);
      console.log('\nMake sure the Docker container is running with:');
      console.log('npm run docker:dev');
      return;
    }

    try {
      const parsedData = JSON.parse(responseData);

      if (parsedData.deviceId && parsedData.authKey) {
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
      } else {
        console.error('Unexpected response format:');
        console.log(parsedData);
      }
    } catch (error) {
      console.error('Error parsing response:', error.message);
      console.log('Raw response:', responseData);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request error:', error.message);
  console.log('\nDoes the Docker container need to be started? Try running:');
  console.log('npm run docker:dev');
});

// Write data and end request
req.write(jsonData);
req.end();

// Usage instructions
console.log(`
Usage:
  node register-device.js [deviceId]

Example:
  node register-device.js my-plant-device-001
`);
