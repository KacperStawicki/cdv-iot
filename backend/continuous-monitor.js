const WebSocket = require('ws');
const crypto = require('crypto');

// Configuration
const deviceId = process.argv[2] || 'test-device-1';
const authKey = process.argv[3] || '32f0ac9f626f7e24866996f60e859d2a'; // This should be provided during device setup
const serverUrl = `ws://localhost:8080/websocket?deviceId=${deviceId}`;
const intervalSeconds = parseInt(process.argv[4] || '30', 10);

// Generate random moisture level between 0 and 100
const getRandomMoistureLevel = () => Math.floor(Math.random() * 101);

console.log(`Starting device simulation for ${deviceId}`);
console.log(`Using authentication key: ${authKey}`);
console.log(
  `Will send measurements every ${intervalSeconds} seconds once claimed`
);
console.log(`WebSocket URL: ${serverUrl}`);

// Variables to track configuration
let thresholdRed = 0;
let thresholdYellow = 0;
let thresholdGreen = 0;
let isClaimed = false;

// Generate MD5 signature for authentication
function generateSignature(deviceId, authKey, timestamp) {
  return crypto
    .createHash('md5')
    .update(`${deviceId}:${authKey}:${timestamp}`)
    .digest('hex');
}

// Function to connect and authenticate
function startDevice() {
  // Create WebSocket connection
  const ws = new WebSocket(serverUrl);
  let authenticated = false;
  let interval;

  // Send a measurement
  function sendMeasurement() {
    if (!authenticated || !isClaimed) {
      console.log(
        'Not sending measurement: Device is not authenticated or not claimed yet'
      );
      return;
    }

    const moistureLevel = getRandomMoistureLevel();

    // Determine moisture status based on thresholds
    let status = 'Unknown';
    if (moistureLevel <= thresholdRed) {
      status = 'DRY (RED)';
    } else if (moistureLevel <= thresholdYellow) {
      status = 'LOW (YELLOW)';
    } else if (moistureLevel <= thresholdGreen) {
      status = 'GOOD (GREEN)';
    } else {
      status = 'WET (BLUE)';
    }

    const message = {
      type: 'measurement',
      deviceId,
      moistureLevel,
      timestamp: new Date().toISOString(),
    };

    console.log(
      `Sending measurement: Moisture Level = ${moistureLevel}% (${status})`
    );
    ws.send(JSON.stringify(message));
  }

  // Send authentication message
  function authenticate() {
    const timestamp = new Date().toISOString();
    const signature = generateSignature(deviceId, authKey, timestamp);

    const authMessage = {
      type: 'auth',
      deviceId,
      timestamp,
      signature,
    };

    console.log('Sending authentication...');
    ws.send(JSON.stringify(authMessage));
  }

  // Connection opened
  ws.on('open', () => {
    console.log('Connection established!');
  });

  // Listen for messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Handle different message types
      if (message.type === 'welcome') {
        console.log(`Server message: ${message.message}`);
        // Authenticate after welcome
        authenticate();
      } else if (message.type === 'auth_success') {
        authenticated = true;
        isClaimed = message.claimed;
        console.log(
          `Authentication successful! Device ${isClaimed ? 'is' : 'is not'} claimed.`
        );

        if (isClaimed) {
          console.log('Device is claimed - starting to send measurements');
          // Start sending measurements at the specified interval
          if (!interval) {
            // Send an initial measurement right away
            setTimeout(() => {
              sendMeasurement();
            }, 500);

            // Then start the regular interval
            interval = setInterval(sendMeasurement, intervalSeconds * 1000);
          }
        } else {
          console.log('Waiting for device to be claimed...');
        }
      } else if (message.type === 'claimed') {
        isClaimed = true;
        console.log(
          'Device has been claimed! Starting to send measurements...'
        );

        // Update thresholds
        thresholdRed = message.thresholdRed;
        thresholdYellow = message.thresholdYellow;
        thresholdGreen = message.thresholdGreen;

        console.log(`Device configuration:
        RED threshold:    ${thresholdRed}%
        YELLOW threshold: ${thresholdYellow}%
        GREEN threshold:  ${thresholdGreen}%`);

        // Explicitly send an initial measurement immediately after being claimed
        setTimeout(() => {
          sendMeasurement();
        }, 500);

        // Start sending measurements
        if (!interval) {
          interval = setInterval(sendMeasurement, intervalSeconds * 1000);
        }
      } else if (message.type === 'config') {
        thresholdRed = message.thresholdRed;
        thresholdYellow = message.thresholdYellow;
        thresholdGreen = message.thresholdGreen;

        console.log(`Device configuration updated:
        RED threshold:    ${thresholdRed}%
        YELLOW threshold: ${thresholdYellow}%
        GREEN threshold:  ${thresholdGreen}%`);
      } else if (message.type === 'ack') {
        // Acknowledgment received
      } else if (message.type === 'error') {
        console.error(`Error from server: ${message.message}`);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    cleanup();

    // Try to reconnect after 5 seconds
    setTimeout(startDevice, 5000);
  });

  // Connection closed
  ws.on('close', () => {
    console.log('Connection closed. Attempting to reconnect in 5 seconds...');
    cleanup();

    // Try to reconnect after 5 seconds
    setTimeout(startDevice, 5000);
  });

  // Cleanup function to clear the interval
  function cleanup() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    authenticated = false;
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Interrupted, closing connection...');
    cleanup();
    ws.close();
    setTimeout(() => process.exit(0), 500);
  });
}

// Start the device
startDevice();

console.log(`
Usage:
  node continuous-monitor.js [deviceId] [authKey] [intervalSeconds]

Example:
  node continuous-monitor.js test-device-001 1234567890abcdef 5
`);
