# IoT Plant Moisture Monitoring System - Backend

This is a WebSocket-based backend for an IoT plant moisture monitoring system. The system allows IoT devices to report moisture levels and receive LED threshold configurations (red, yellow, green) to indicate moisture status.

## Features

- **Real-time communication** via WebSockets
- **Device auto-registration** when they first connect
- **Moisture level logging** in the database
- **Configurable thresholds** for moisture status indicators
- **Auto-reconnection** for devices
- **Test utilities** for simulating device behavior
- **Authentication** for secure access to device controls
- **Device ownership verification** to prevent unauthorized access

## Architecture

The backend is built with the following technologies:

- **Fastify** - Web server framework
- **WebSockets** (`@fastify/websocket`) - Real-time communication
- **PostgreSQL** - Database for storing users, devices, and measurements
- **Prisma** - ORM for database access
- **Zod** - Schema validation
- **JWT** - JSON Web Tokens for authentication
- **Docker** - Containerization

## API Endpoints

### WebSocket Endpoints

- `/websocket` - Main endpoint for device connections

  - Devices connect here to send measurements and receive configurations
  - Query parameters:
    - `deviceId` - Optional device identifier
  - No authentication required (devices use their own ID for identification)

- `/websocket/client` - Endpoint for client applications
  - For front-end applications to receive real-time updates
  - **Authentication required** - Users must be logged in

### HTTP Endpoints

- `POST /device/command` - Send commands to devices
  - Used to update device configurations
  - **Device authentication required** - Users can only control their own devices
  - Request body:
    ```json
    {
      "type": "configure",
      "deviceId": "device-id",
      "payload": {
        "thresholdRed": 20,
        "thresholdYellow": 50,
        "thresholdGreen": 80
      }
    }
    ```

## Authentication

Authentication is implemented using JWT (JSON Web Tokens) with HTTP-only cookies.

1. Users must first authenticate through the `/auth/login` endpoint
2. The server sets HTTP-only cookies containing access and refresh tokens
3. Authenticated endpoints automatically validate these tokens
4. Access to device commands is restricted to the device owner

### Authentication Decorators

The system includes two authentication decorators:

1. **authenticate** - Basic user authentication

   - Verifies the user's JWT token
   - Makes user data available in `request.user`

2. **authenticate_device** - Device ownership verification
   - Extends basic authentication
   - Verifies that the requested device belongs to the authenticated user
   - Makes device data available in `request.device`
   - Works with deviceId in route params, query params, or request body
   - Returns appropriate error codes:
     - 401 Unauthorized - If user is not authenticated
     - 400 Bad Request - If deviceId is missing
     - 404 Not Found - If device doesn't exist
     - 403 Forbidden - If user doesn't own the device

For testing:

- Use the default admin account: admin@example.com / password123
- Login before attempting to use authenticated endpoints

## Message Types

### Device to Server

- **Measurement Message**
  ```json
  {
    "type": "measurement",
    "deviceId": "device-id",
    "moistureLevel": 65,
    "timestamp": "2023-05-04T12:34:56Z"
  }
  ```

### Server to Device

- **Welcome Message**

  ```json
  {
    "type": "welcome",
    "message": "Connected as device device-id"
  }
  ```

- **Configuration Message**

  ```json
  {
    "type": "config",
    "thresholdRed": 20,
    "thresholdYellow": 50,
    "thresholdGreen": 80
  }
  ```

- **Acknowledgment Message**

  ```json
  {
    "type": "ack",
    "status": "success"
  }
  ```

- **Error Message**
  ```json
  {
    "type": "error",
    "message": "Invalid message format"
  }
  ```

## Database Schema

- **User** - Stores user information
  - `id`, `email`, `password`, `firstName`, `lastName`
- **Device** - Stores device information
  - `id`, `name`, `userId`, `thresholdRed`, `thresholdYellow`, `thresholdGreen`
- **Measurement** - Stores moisture measurements
  - `id`, `deviceId`, `moistureLevel`, `timestamp`

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 14+ (for running test clients)

### Setup

1. Clone the repository
2. Navigate to the backend directory
3. Run the application using Docker Compose:

```bash
docker-compose up -d
```

4. The server will be available at http://localhost:8080

### Database Setup

The system automatically sets up the database and runs migrations on startup. A seed script creates:

- A test user (admin@example.com / password123)
- A test device (test-device-001) with the following default thresholds:
  - Red: 15%
  - Yellow: 40%
  - Green: 70%

### Device Auto-Registration

The system automatically registers new devices when they first connect. When a device connects with an unknown deviceId:

1. The system looks for an existing user in the database
2. It creates a new device record associated with that user
3. Default threshold values are assigned to the device
4. The device receives its configuration immediately

This feature eliminates the need to manually register devices before they can connect and report data.

## Available Scripts

The project includes several npm scripts for development and database management:

### Development

```bash
# Start development server with hot reload
npm run docker:dev

# Format code
npm run format

# Check formatting
npm run format:check
```

### Database Management inside of Docker

```bash
# Seed the database with test data
npm run db:seed

# Run database migrations
npm run db:migrate

# Access Prisma Studio (database GUI)
npm run db:studio

# Reset the database (clear all data)
npm run db:reset

# Refresh the database (reset + migrate + seed)
npm run db:refresh
```

### Docker Commands

```bash
# Start development environment
npm run docker:dev

# Refresh database in Docker
npm run docker:db:refresh

# Stop Docker containers
npm run docker:stop

# Run Prisma Studio in Docker
npm run docker:studio
```

## Testing

Several test utilities are provided for testing the system:

### Single Reading Test

Sends a single random moisture reading and receives the device configuration:

```bash
node ws-test-client.js [deviceId]
```

Example:

```bash
node ws-test-client.js test-device-001
```

### Continuous Monitoring

Continuously sends random moisture readings at specified intervals:

```bash
node continuous-monitor.js [deviceId] [intervalSeconds]
```

Example:

```bash
node continuous-monitor.js test-device-001 3
```

This will:

- Connect to the WebSocket server at ws://localhost:8080/websocket
- Send random moisture readings every 3 seconds
- Display the moisture status (DRY/LOW/GOOD/WET) based on thresholds
- Automatically reconnect if disconnected

### Sending Configuration Commands

Updates the threshold values for a device:

```bash
node send-command.js [deviceId] [redThreshold] [yellowThreshold] [greenThreshold]
```

Example:

```bash
node send-command.js test-device-001 20 50 80
```

## Moisture Status Thresholds

The system uses four status levels for moisture:

- **DRY (RED)** - Moisture level ≤ Red threshold
- **LOW (YELLOW)** - Moisture level > Red threshold and ≤ Yellow threshold
- **GOOD (GREEN)** - Moisture level > Yellow threshold and ≤ Green threshold
- **WET (BLUE)** - Moisture level > Green threshold

Default seed values:

- Red: 15%
- Yellow: 40%
- Green: 70%

Default values for new devices:

- Red: 10%
- Yellow: 40%
- Green: 60%

## Troubleshooting

- If devices cannot connect, ensure the WebSocket server is running on port 8080
- Check database connection by verifying logs in Docker
- Ensure device IDs are consistent between test clients and database
- If you encounter errors with database connections, try running `npm run db:refresh` or `npm run docker:db:refresh`

## Development

For development purposes, you can use the development Docker Compose:

```bash
docker-compose -f docker-compose.dev.yml up
# or
npm run docker:dev
```

This enables hot reloading and more verbose logging.

## Device Authentication and Claiming

The system now includes a secure device authentication and claiming process:

### Device Authentication

1. Devices connect to the WebSocket endpoint but do not start sending data automatically
2. Instead, they must authenticate first using their assigned authentication key
3. Authentication uses an MD5 signature verification where:
   - The device sends: `deviceId`, `timestamp`, and a `signature`
   - The signature is computed as: `MD5(deviceId + ":" + authKey + ":" + timestamp)`
   - The server verifies this signature using the stored `authKey` for the device

### Device Registration

Before a device can connect, it must be registered in the system:

```bash
# Register a new device
node register-device.js [optional-device-id]
```

This returns a `deviceId` and an `authKey` that must be configured on the device.

### Device Claiming

New devices are registered but unclaimed by default. A device must be claimed by a user before it can send measurements:

1. A user logs into the frontend application
2. They navigate to the "Add Device" page
3. They provide the `deviceId` and `authKey` for their device
4. The system verifies the key and assigns the device to that user
5. The device receives a notification that it's been claimed and starts sending data

This ensures that:

- Only registered devices can connect to the system
- Devices don't send data until they're associated with a user
- Users can only claim devices they physically have (as they need the authKey)

### Test Flow

To test the complete flow:

1. Register a new device:

   ```bash
   node register-device.js my-device-001
   ```

2. Take note of the `deviceId` and `authKey` provided

3. Start the device simulation:

   ```bash
   node continuous-monitor.js my-device-001 [auth-key] 5
   ```

4. The device will connect and authenticate but won't send data yet

5. Login to the web application and claim the device by providing:

   - Device ID: `my-device-001`
   - Auth Key: (the key from step 2)

6. Once claimed, the device will automatically start sending moisture measurements

## License

This project is licensed under the MIT License.
