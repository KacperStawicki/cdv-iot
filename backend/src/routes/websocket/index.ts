import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

// Define message types
const DeviceMessageSchema = z.object({
  type: z.literal('measurement'),
  deviceId: z.string(),
  moistureLevel: z.number().min(0).max(100),
  timestamp: z.string().optional(), // ISO string, optional as we can use server time
});

// Define query parameters type
interface DeviceQueryParams {
  deviceId?: string;
}

// Map to store active device connections - exported for use in command routes
export const deviceConnections = new Map<string, WebSocket>();

const wsRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const prisma = new PrismaClient();

  // Helper function to ensure a device exists in the database
  async function ensureDeviceExists(deviceId: string) {
    try {
      // Try to find the device
      let device = await prisma.device.findUnique({
        where: { id: deviceId },
      });

      // If device doesn't exist, create it
      if (!device) {
        fastify.log.info(`Creating new device with ID: ${deviceId}`);

        // First, find a user to associate with the device
        // (In a real app, you'd have proper authentication)
        const firstUser = await prisma.user.findFirst();

        if (!firstUser) {
          fastify.log.error(
            'Cannot create device - no users exist in the database'
          );
          return null;
        }

        // Create the device with default values
        device = await prisma.device.create({
          data: {
            id: deviceId,
            name: `Device ${deviceId}`,
            userId: firstUser.id,
            thresholdRed: 10,
            thresholdYellow: 40,
            thresholdGreen: 60,
          },
        });

        fastify.log.info(`Device ${deviceId} created successfully`);
      }

      return device;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error ensuring device exists: ${errorMessage}`);
      return null;
    }
  }

  // WebSocket route for device connections
  fastify.get<{ Querystring: DeviceQueryParams }>(
    '',
    {
      websocket: true,
      schema: {
        querystring: z.object({
          deviceId: z
            .string()
            .optional()
            .describe('The unique identifier for the device connecting'),
        }),
        tags: ['WebSocket'],
        summary: 'Device WebSocket Endpoint',
        description:
          'WebSocket endpoint for IoT devices to connect and send moisture measurements. Devices can connect by providing deviceId in querystring or in the message payload.',
      },
    },
    (connection, req) => {
      // Get deviceId from query parameter or message
      let deviceId: string | null = req.query.deviceId || null;

      if (deviceId) {
        // Store the connection immediately if deviceId is in query params
        deviceConnections.set(deviceId, connection);
        fastify.log.info(`Device ${deviceId} connected via query parameter`);

        // Send a welcome message
        connection.send(
          JSON.stringify({
            type: 'welcome',
            message: `Connected as device ${deviceId}`,
          })
        );

        // Ensure the device exists and send its configuration
        ensureDeviceExists(deviceId)
          .then((device) => {
            if (device) {
              // Send thresholds to device
              connection.send(
                JSON.stringify({
                  type: 'config',
                  thresholdRed: device.thresholdRed,
                  thresholdYellow: device.thresholdYellow,
                  thresholdGreen: device.thresholdGreen,
                })
              );
            }
          })
          .catch((err) => {
            fastify.log.error(`Error fetching device config: ${err.message}`);
          });
      }

      connection.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          fastify.log.debug(`Received message: ${message.toString()}`);

          // Handle device measurement
          if (data.type === 'measurement') {
            const msg = DeviceMessageSchema.parse(data);

            // If deviceId wasn't in query params, get it from the message
            if (!deviceId) {
              deviceId = msg.deviceId;
              deviceConnections.set(deviceId, connection);
              fastify.log.info(`Device ${deviceId} connected via message`);
            }

            // Ensure the device exists
            const device = await ensureDeviceExists(deviceId);

            if (!device) {
              connection.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to register device',
                })
              );
              return;
            }

            // Store the measurement in the database
            await prisma.measurement.create({
              data: {
                deviceId: msg.deviceId,
                moistureLevel: msg.moistureLevel,
                timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
              },
            });

            // Acknowledge the message
            connection.send(JSON.stringify({ type: 'ack', status: 'success' }));

            // Send config data if we haven't already
            connection.send(
              JSON.stringify({
                type: 'config',
                thresholdRed: device.thresholdRed,
                thresholdYellow: device.thresholdYellow,
                thresholdGreen: device.thresholdGreen,
              })
            );
          } else {
            // Unknown message type
            connection.send(
              JSON.stringify({
                type: 'error',
                message: 'Unknown message type',
              })
            );
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          fastify.log.error(`Error processing message: ${errorMessage}`);
          connection.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          );
        }
      });

      // Handle disconnection
      connection.on('close', () => {
        if (deviceId) {
          deviceConnections.delete(deviceId);
          fastify.log.info(`Device ${deviceId} disconnected`);
        }
      });
    }
  );
};

export default wsRoutes;
