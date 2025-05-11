const http = require('http');

// Command configuration
const deviceId = process.argv[2] || 'test-device-001';
const thresholdRed = parseInt(process.argv[3] || '10', 10);
const thresholdYellow = parseInt(process.argv[4] || '20', 10);
const thresholdGreen = parseInt(process.argv[5] || '30', 10);

// Command data
const commandData = {
  type: 'configure',
  deviceId,
  payload: {
    thresholdRed,
    thresholdYellow,
    thresholdGreen,
  },
};

console.log('Sending command:', commandData);

// Convert data to JSON string
const jsonData = JSON.stringify(commandData);

// HTTP request options
const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/websocket/command',
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
      console.log('Response:', parsedData);
    } catch (error) {
      console.error('Error parsing response:', error);
      console.log('Raw response:', responseData);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Request error:', error.message);
  console.log('\nMake sure the Docker container is running with:');
  console.log('npm run docker:dev');
});

// Write data and end request
req.write(jsonData);
req.end();

// Usage instructions
console.log(`
Usage:
  node send-command.js [deviceId] [redThreshold] [yellowThreshold] [greenThreshold]

Example:
  node send-command.js test-device-001 10 30 60
`);
