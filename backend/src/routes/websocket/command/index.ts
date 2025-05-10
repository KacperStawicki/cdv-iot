import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { PrismaClient, Device } from '@prisma/client';

// Import device connections map from parent module
import { deviceConnections } from '..';

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

// Extended request type that includes the device property
interface RequestWithDevice {
  device: Device;
}

const commandRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  const prisma = new PrismaClient();

  // Route for admin/user to send commands to devices
  // Use authenticate_device instead of authenticate
  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate_device],
      schema: {
        body: DeviceCommandSchema,
        response: {
          200: z.object({
            status: z.enum(['success', 'pending']),
            message: z.string(),
          }),
          400: z.object({
            error: z.string(),
          }),
        },
        tags: ['WebSocket'],
        summary: 'Send Command to Device',
        description:
          'Sends a command to a connected IoT device. Requires authentication and device ownership. Commands include configuring thresholds and pairing.',
      },
    },
    async (request, reply) => {
      try {
        fastify.log.debug(
          `Command request body: ${JSON.stringify(request.body)}`
        );
        const command = DeviceCommandSchema.parse(request.body);
        const { deviceId, type, payload } = command;

        // The device is pre-verified to belong to the authenticated user
        // and available as request.device
        const device = (request as unknown as RequestWithDevice).device;

        // If it's a configuration update, update the database
        if (type === 'configure') {
          await prisma.device.update({
            where: { id: deviceId },
            data: {
              thresholdRed: payload.thresholdRed ?? device.thresholdRed,
              thresholdYellow:
                payload.thresholdYellow ?? device.thresholdYellow,
              thresholdGreen: payload.thresholdGreen ?? device.thresholdGreen,
            },
          });
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
          // Device is not currently connected
          return reply.send({
            status: 'pending',
            message:
              'Device is not currently connected. Command will be sent when device connects.',
          });
        }
      } catch (error) {
        fastify.log.error(
          `Error processing command: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return reply.code(400).send({ error: 'Invalid command format' });
      }
    }
  );
};

export default commandRoutes;
