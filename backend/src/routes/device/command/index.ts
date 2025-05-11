import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { Device } from '@prisma/client';

// Import device connections map from parent module
import { deviceConnections } from '../../websocket';

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
        tags: ['Device'],
        summary: 'Send Command to Device',
        description:
          'Sends a command to a connected IoT device. Requires authentication and device ownership. Commands include configuring thresholds and pairing.',
      },
    },
    async (request, reply) => {
      const command = DeviceCommandSchema.parse(request.body);
      const { deviceId, type, payload } = command;

      const device = (request as unknown as RequestWithDevice).device;

      if (type === 'configure') {
        await fastify.prismaClient.device.update({
          where: { id: deviceId },
          data: {
            thresholdRed: payload.thresholdRed ?? device.thresholdRed,
            thresholdYellow: payload.thresholdYellow ?? device.thresholdYellow,
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
          message: 'Command sent to device',
        });
      } else {
        // Device is not currently connected
        return reply.send({
          message: 'Device is not currently connected.',
        });
      }
    }
  );
};

export default commandRoutes;
