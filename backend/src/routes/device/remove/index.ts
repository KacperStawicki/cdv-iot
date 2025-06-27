import { z } from 'zod';
import { deviceConnections } from '../../websocket';
import { TokenDecoded } from '../../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const RemoveDeviceSchema = z.object({
  deviceId: z.string(),
});

const removeDevice: FastifyPluginAsyncZod = async (fastify): Promise<void> => {
  fastify.post<{ Body: z.infer<typeof RemoveDeviceSchema> }>(
    '',
    {
      schema: {
        body: RemoveDeviceSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            device: z.object({
              id: z.string(),
              claimed: z.boolean(),
            }),
          }),
          404: z.object({ error: z.string() }),
        },
        tags: ['Device'],
        summary: 'Remove a device from the current account',
        description:
          'Unclaim a device and detach it from the authenticated user. The device becomes claimable again.',
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { deviceId } = request.body;
      const userId = request.user as TokenDecoded;

      // Check device belongs to user
      const device = await fastify.prismaClient.device.findFirst({
        where: {
          id: deviceId,
          userId: userId.id,
        },
      });

      if (!device) {
        return reply.status(404).send({ error: 'Device not found' });
      }

      // Update: unclaim device
      const updatedDevice = await fastify.prismaClient.device.update({
        where: { id: deviceId },
        data: {
          userId: null,
          claimed: false,
          name: null,
        },
      });

      // Notify device if connected
      if (deviceConnections.has(deviceId)) {
        const connection = deviceConnections.get(deviceId);
        connection?.send(
          JSON.stringify({
            type: 'claimed',
            claimed: false,
          })
        );
      }

      return {
        success: true,
        device: {
          id: updatedDevice.id,
          claimed: updatedDevice.claimed,
        },
      };
    }
  );
};

export default removeDevice;
