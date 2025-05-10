const WebSocket = require('ws');

// Configuration
const deviceId = process.argv[2] || 'test-device-001';
const serverUrl = `ws://localhost:8080/websocket?deviceId=${deviceId}`;
// Generate random moisture level between 0 and 100
const getRandomMoistureLevel = () => Math.floor(Math.random() * 101);

console.log(`Testing WebSocket connection to ${serverUrl}`);

// Create WebSocket connection
const ws = new WebSocket(serverUrl);

// Connection opened
ws.on('open', () => {
  console.log('Connection established!');
  
  // Generate random moisture level
  const moistureLevel = getRandomMoistureLevel();
  
  // Send a measurement message to the server
  const message = {
    type: 'measurement',
    deviceId,
    moistureLevel,
    timestamp: new Date().toISOString()
  };
  
  console.log('Sending measurement:', message);
  ws.send(JSON.stringify(message));
});

// Listen for messages
ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('Received message:', message);
    
    // If we received a config message, display the thresholds
    if (message.type === 'config') {
      console.log(`Device configuration received:
      RED threshold:    ${message.thresholdRed}%
      YELLOW threshold: ${message.thresholdYellow}%
      GREEN threshold:  ${message.thresholdGreen}%`);
    }
    
    // After a few seconds, close the connection
    if (message.type === 'ack') {
      setTimeout(() => {
        console.log('Test completed, closing connection...');
        ws.close();
      }, 2000);
    }
  } catch (error) {
    console.error('Error parsing message:', error);
    console.log('Raw message:', data.toString());
  }
});

// Handle errors
ws.on('error', (error) => {
  console.error('WebSocket error:', error.message);
});

// Connection closed
ws.on('close', (code, reason) => {
  console.log(`Connection closed: Code ${code}${reason ? `, Reason: ${reason}` : ''}`);
  process.exit(0);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Interrupted, closing connection...');
  ws.close();
  setTimeout(() => process.exit(0), 500);
}); 