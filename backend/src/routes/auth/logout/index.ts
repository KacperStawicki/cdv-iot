import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const logout: FastifyPluginAsyncZod = async (fastify) => {
  fastify.post(
    '',
    {
      onRequest: [fastify.authenticate],
      schema: {
        response: {
          200: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
        tags: ['Authentication'],
        summary: 'User logout',
        description:
          'Logs out the current user by clearing the access and refresh tokens.',
      },
    },
    async (request, reply) => {
      reply.setCookie('accessToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
        sameSite: 'strict',
      });

      return reply.status(302).redirect('/');
    }
  );
};

export default logout;
