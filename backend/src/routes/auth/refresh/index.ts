import { RefreshTokenDecoded } from '../../../utils/types';
import { generateAccessToken } from '../_functions/generateAccessToken';
import { FastifyPluginAsync } from 'fastify';
import { setAuthCookies } from '../_functions/setAuthCookies';
import { z } from 'zod';

const refresh: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '',
    {
      onRequest: [fastify.refresh],
      schema: {
        response: {
          200: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description:
          'Refreshes the access token using the refresh token, returning a new access token.',
      },
    },
    async (request, reply) => {
      const user: RefreshTokenDecoded = request.user as RefreshTokenDecoded;

      const accessToken = await generateAccessToken(user.email, fastify);

      if (!accessToken) {
        return reply.code(404).send({ message: 'User not found' });
      }

      setAuthCookies(reply, { accessToken });

      return reply.code(200).send({
        message: 'Token refresh successful',
      });
    }
  );
};

export default refresh;
