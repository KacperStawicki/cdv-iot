import WebSocket from 'ws';

// Configuration
const deviceId = process.argv[2] || 'test-device-001';
const serverUrl = `ws://localhost:8080/websocket?deviceId=${deviceId}`;
const intervalSeconds = parseInt(process.argv[3] || '5', 10);

// Generate random moisture level between 0 and 100
const getRandomMoistureLevel = () => Math.floor(Math.random() * 101);

console.log(`Starting continuous monitoring for device ${deviceId}`);
console.log(`Sending measurements every ${intervalSeconds} seconds`);
console.log(`WebSocket URL: ${serverUrl}`);

// Variables to track configuration
let thresholdRed = 0;
let thresholdYellow = 0;
let thresholdGreen = 0;

// Function to connect and start sending data
function startMonitoring() {
  // Create WebSocket connection
  const ws = new WebSocket(serverUrl);
  let connected = false;
  let interval;

  // Send a measurement
  function sendMeasurement() {
    if (!connected) return;

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

  // Connection opened
  ws.on('open', () => {
    console.log('Connection established!');
    connected = true;

    // Start sending measurements at the specified interval
    interval = setInterval(sendMeasurement, intervalSeconds * 1000);
  });

  // Listen for messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      // Handle different message types
      if (message.type === 'config') {
        thresholdRed = message.thresholdRed;
        thresholdYellow = message.thresholdYellow;
        thresholdGreen = message.thresholdGreen;

        console.log(`Device configuration updated:
        RED threshold:    ${thresholdRed}%
        YELLOW threshold: ${thresholdYellow}%
        GREEN threshold:  ${thresholdGreen}%`);
      } else if (message.type === 'welcome') {
        console.log(`Server message: ${message.message}`);
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
    setTimeout(startMonitoring, 5000);
  });

  // Connection closed
  ws.on('close', () => {
    console.log('Connection closed. Attempting to reconnect in 5 seconds...');
    cleanup();

    // Try to reconnect after 5 seconds
    setTimeout(startMonitoring, 5000);
  });

  // Cleanup function to clear the interval
  function cleanup() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
    connected = false;
  }

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('Interrupted, closing connection...');
    cleanup();
    ws.close();
    setTimeout(() => process.exit(0), 500);
  });
}

// Start the monitoring process
startMonitoring();
