import { z } from 'zod';
import { DeviceRenameSchema } from '../../../types/device';
import { TokenDecoded } from '../../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

const renameDevice: FastifyPluginAsyncZod = async (fastify): Promise<void> => {
  fastify.post<{ Body: z.infer<typeof DeviceRenameSchema> }>(
    '',
    {
      schema: {
        body: DeviceRenameSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            device: z.object({
              id: z.string(),
              name: z.string(),
            }),
          }),
          404: z.object({ error: z.string() }),
        },
        tags: ['Device'],
        summary: 'Rename a device',
        description:
          'Change the display name of a device owned by the authenticated user.',
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { deviceId, name } = request.body;
      const userId = request.user as TokenDecoded;

      // Ensure device belongs to the requesting user
      const device = await fastify.prismaClient.device.findFirst({
        where: { id: deviceId, userId: userId.id },
        select: { id: true },
      });

      if (!device) {
        return reply.status(404).send({ error: 'Device not found' });
      }

      const updatedDevice = await fastify.prismaClient.device.update({
        where: { id: deviceId },
        data: { name },
        select: { id: true, name: true },
      });

      return { success: true, device: updatedDevice };
    }
  );
};

export default renameDevice;
