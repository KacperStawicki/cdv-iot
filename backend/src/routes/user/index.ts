import { TokenDecoded } from '../../utils/types';
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';

const userDetails: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: z.object({
            id: z.string(),
            email: z.string(),
            firstName: z.string(),
            lastName: z.string(),
          }),
          404: z.object({ message: z.string() }),
        },
        tags: ['User'],
        summary: 'Get user data',
        description: 'Gets the user data for the current user.',
      },
    },
    async (request, reply) => {
      const user: TokenDecoded = request.user as TokenDecoded;

      const userData = await fastify.prismaClient.user.findUnique({
        where: { id: user.id },
      });

      if (!userData) {
        return reply.status(404).send({ message: 'User not found' });
      }

      const response = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      };

      return reply.code(200).send(response);
    }
  );
};

export default userDetails;
