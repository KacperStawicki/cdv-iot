import { z } from 'zod';
import { TokenDecoded } from '../../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const listDevices: FastifyPluginAsyncZod = async (fastify): Promise<void> => {
  fastify.get(
    '',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
              claimed: z.boolean(),
              thresholdRed: z.number(),
              thresholdYellow: z.number(),
              thresholdGreen: z.number(),
              online: z.boolean(),
            })
          ),
        },
        tags: ['Device'],
        summary: 'Get all devices',
        description: 'Get all devices for the authenticated user',
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      // Get authenticated user
      const userId = request.user as TokenDecoded;

      const devices = await fastify.prismaClient.device.findMany({
        where: { userId: userId.id },
        select: {
          id: true,
          name: true,
          claimed: true,
          thresholdRed: true,
          thresholdYellow: true,
          thresholdGreen: true,
        },
      });

      // Map devices to include online status using deviceConnections map
      // Import deviceConnections dynamically to avoid circular issues
      const { deviceConnections } = await import('../../websocket/index.js');

      return devices.map((d) => ({
        ...d,
        online: deviceConnections.has(d.id),
      }));
    }
  );
};

export default listDevices;
