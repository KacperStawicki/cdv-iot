import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Device } from '@prisma/client';

// Import device connections map from parent module
import { deviceConnections } from '../../websocket/index.js';
import { clientConnections } from '../../websocket/client/index.js';
import { broadcastToConnections } from '../../websocket/index.js';

const DeviceCommandSchema = z.object({
  type: z.enum(['configure', 'pair']),
  deviceId: z.string(),
  payload: z.object({
    thresholdRed: z.number().min(0).max(100).optional(),
    thresholdYellow: z.number().min(0).max(100).optional(),
    thresholdGreen: z.number().min(0).max(100).optional(),
    pairingCode: z.string().optional(),
  }),
});

interface RequestWithDevice {
  device: Device;
}

const commandRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.post(
    '/',
    {
      preHandler: [fastify.authenticate_device],
      schema: {
        body: DeviceCommandSchema,
        response: {
          200: z.object({
            status: z.enum(['success', 'pending']),
            message: z.string(),
          }),
          400: z.object({ error: z.string() }),
          401: z.object({ message: z.string() }),
          403: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
          500: z.object({ error: z.string() }),
        },
        tags: ['Device'],
        summary: 'Send Command to Device',
        description:
          'Sends a command to a connected IoT device. Requires authentication and device ownership. Commands include configuring thresholds and pairing.',
      },
    },
    async (request, reply) => {
      try {
        const command = DeviceCommandSchema.parse(request.body);
        const { deviceId, type, payload } = command;

        const device = (request as unknown as RequestWithDevice).device;

        if (type === 'configure') {
          const updated = await fastify.prismaClient.device.update({
            where: { id: deviceId },
            data: {
              thresholdRed: payload.thresholdRed ?? device.thresholdRed,
              thresholdYellow:
                payload.thresholdYellow ?? device.thresholdYellow,
              thresholdGreen: payload.thresholdGreen ?? device.thresholdGreen,
            },
          });

          // Broadcast new thresholds to owner's clients
          if (device.userId) {
            broadcastToConnections(clientConnections.get(device.userId), {
              type: 'threshold_update',
              deviceId: updated.id,
              thresholdRed: updated.thresholdRed,
              thresholdYellow: updated.thresholdYellow,
              thresholdGreen: updated.thresholdGreen,
            });
          }
        }

        // If the device is connected, send the command
        const deviceConnection = deviceConnections.get(deviceId);
        if (deviceConnection) {
          deviceConnection.send(
            JSON.stringify({
              type,
              ...payload,
            })
          );
          return reply.send({
            status: 'success',
            message: 'Command sent to device',
          });
        } else {
          // Device is not currently connected, thresholds updated in DB
          return reply.send({
            status: 'pending',
            message: 'Device is not currently connected. Command recorded.',
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          return reply.status(400).send({
            error: `Validation error: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          });
        }

        // Handle other errors
        return reply.status(500).send({
          error: 'Internal server error',
        });
      }
    }
  );
};

export default commandRoutes;
