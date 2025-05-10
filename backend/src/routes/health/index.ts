import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const health: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '',
    {
      schema: {
        response: {
          200: z.object({
            status: z.string(),
            timestamp: z.string(),
          }),
        },
      },
    },
    async function () {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }
  );
};

export default health;