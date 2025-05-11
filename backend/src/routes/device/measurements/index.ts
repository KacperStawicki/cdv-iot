import { z } from 'zod';
import { TokenDecoded } from '../../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const getDeviceMeasurements: FastifyPluginAsyncZod = async (
  fastify
): Promise<void> => {
  fastify.get<{ Params: { deviceId: string } }>(
    '/:deviceId',
    {
      schema: {
        params: z.object({
          deviceId: z.string(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              deviceId: z.string(),
              moistureLevel: z.number(),
              timestamp: z.string(),
            })
          ),
          404: z.object({
            error: z.string(),
          }),
        },
        tags: ['Device'],
        summary: 'Get device measurements',
        description: 'Get the last 10 measurements for a specific device',
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      // Get authenticated user
      const userId = request.user as TokenDecoded;
      const { deviceId } = request.params;

      // Check if the device belongs to the user
      const device = await fastify.prismaClient.device.findFirst({
        where: {
          id: deviceId,
          userId: userId.id,
        },
      });

      if (!device) {
        return reply.status(404).send({
          error: 'Device not found or not owned by user',
        });
      }

      // Get the last 10 measurements for the device
      const measurements = await fastify.prismaClient.measurement.findMany({
        where: {
          deviceId: deviceId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 10,
        select: {
          id: true,
          deviceId: true,
          moistureLevel: true,
          timestamp: true,
        },
      });

      return measurements;
    }
  );
};

export default getDeviceMeasurements;
