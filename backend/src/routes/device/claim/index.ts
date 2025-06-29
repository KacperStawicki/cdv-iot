import { DeviceClaimSchema } from '../../../types/device';
import { deviceConnections } from '../../websocket';
import { z } from 'zod';
import { TokenDecoded } from '../../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const claimDevice: FastifyPluginAsyncZod = async (fastify): Promise<void> => {
  fastify.post<{ Body: z.infer<typeof DeviceClaimSchema> }>(
    '',
    {
      schema: {
        body: DeviceClaimSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            device: z.object({
              id: z.string(),
              name: z.string(),
              claimed: z.boolean(),
            }),
          }),
        },
        tags: ['Device'],
        summary: 'Claim a device',
        description: 'Claim a device and assign it to the authenticated user',
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { authKey, name } = request.body;

      // Get authenticated user
      const userId = request.user as TokenDecoded;

      // Find the device by its authentication key
      const device = await fastify.prismaClient.device.findFirst({
        where: { authKey },
      });

      if (!device) {
        return reply.status(404).send({
          error: 'Device not found',
        });
      }

      // Check if device is already claimed
      if (device.claimed) {
        return reply.status(400).send({
          error: 'Device already claimed',
        });
      }

      // Update the device
      const updatedDevice = await fastify.prismaClient.device.update({
        where: { id: device.id },
        data: {
          userId: userId.id,
          name: name || device.name,
          claimed: true,
        },
      });

      // Notify the device if it's connected
      if (deviceConnections.has(device.id)) {
        const connection = deviceConnections.get(device.id);
        connection?.send(
          JSON.stringify({
            type: 'claimed',
            claimed: true,
            thresholdRed: updatedDevice.thresholdRed,
            thresholdYellow: updatedDevice.thresholdYellow,
            thresholdGreen: updatedDevice.thresholdGreen,
          })
        );

        // Log a message about the notification
        fastify.log.info(`Sent claimed notification to device ${device.id}`);
      }

      return {
        success: true,
        device: {
          id: updatedDevice.id,
          name: updatedDevice.name,
          claimed: updatedDevice.claimed,
        },
      };
    }
  );
};

export default claimDevice;
