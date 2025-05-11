import { FastifyPluginAsync } from 'fastify';
import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { verifyDeviceSignature } from '../../utils/deviceAuth';

// Define message types
const DeviceMessageSchema = z.object({
  type: z.literal('measurement'),
  deviceId: z.string(),
  moistureLevel: z.number().min(0).max(100),
  timestamp: z.string().optional(), // ISO string, optional as we can use server time
});

const DeviceAuthSchema = z.object({
  type: z.literal('auth'),
  deviceId: z.string(),
  timestamp: z.string(),
  signature: z.string(),
});

// Define query parameters type
interface DeviceQueryParams {
  deviceId?: string;
}

// Map to store active device connections - exported for use in command routes
export const deviceConnections = new Map<string, WebSocket>();

const wsRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const prisma = new PrismaClient();

  // Helper function to find a device in the database
  async function findDevice(deviceId: string) {
    try {
      // Try to find the device
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
        include: { user: true },
      });

      return device;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      fastify.log.error(`Error finding device: ${errorMessage}`);
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
          'WebSocket endpoint for IoT devices to connect and send moisture measurements. Devices need to authenticate before sending data.',
      },
    },
    (connection, req) => {
      // Get deviceId from query parameter or message
      let deviceId: string | null = req.query.deviceId || null;
      let isAuthenticated = false;

      // Send a welcome message
      connection.send(
        JSON.stringify({
          type: 'welcome',
          message: 'Please authenticate',
          needsAuth: true,
        })
      );

      connection.on('message', async (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          fastify.log.debug(`Received message: ${message.toString()}`);

          // Handle device authentication first
          if (data.type === 'auth') {
            try {
              const authMessage = DeviceAuthSchema.parse(data);
              deviceId = authMessage.deviceId;

              // Find the device in the database
              const device = await findDevice(deviceId);

              if (!device) {
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Device not found',
                  })
                );
                return;
              }

              // Verify the signature
              if (
                verifyDeviceSignature(
                  deviceId,
                  device.authKey,
                  authMessage.timestamp,
                  authMessage.signature
                )
              ) {
                isAuthenticated = true;
                deviceConnections.set(deviceId, connection);

                // Send authentication success
                connection.send(
                  JSON.stringify({
                    type: 'auth_success',
                    claimed: device.claimed,
                  })
                );

                // If device is claimed, send its configuration
                if (device.claimed) {
                  connection.send(
                    JSON.stringify({
                      type: 'config',
                      thresholdRed: device.thresholdRed,
                      thresholdYellow: device.thresholdYellow,
                      thresholdGreen: device.thresholdGreen,
                    })
                  );
                }
              } else {
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Authentication failed',
                  })
                );
              }
            } catch {
              // Parse error in auth message, just send generic error
              connection.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Invalid authentication message',
                })
              );
            }
          }
          // Handle device measurement only if authenticated
          else if (data.type === 'measurement' && isAuthenticated) {
            try {
              const msg = DeviceMessageSchema.parse(data);

              // Make sure deviceId matches
              if (msg.deviceId !== deviceId) {
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Device ID mismatch',
                  })
                );
                return;
              }

              // Check device claimed status directly from database to ensure we have the latest state
              const currentDevice = await findDevice(deviceId);

              if (!currentDevice || !currentDevice.claimed) {
                connection.send(
                  JSON.stringify({
                    type: 'error',
                    message: 'Device not claimed yet',
                  })
                );
                return;
              }

              // Store the measurement in the database
              await prisma.measurement.create({
                data: {
                  deviceId,
                  moistureLevel: msg.moistureLevel,
                  timestamp: msg.timestamp
                    ? new Date(msg.timestamp)
                    : new Date(),
                },
              });

              // Acknowledge the message
              connection.send(
                JSON.stringify({ type: 'ack', status: 'success' })
              );
            } catch {
              // Validation error with the measurement message
              connection.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Invalid measurement format',
                })
              );
            }
          } else if (!isAuthenticated) {
            // Not authenticated
            connection.send(
              JSON.stringify({
                type: 'error',
                message: 'Please authenticate first',
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
