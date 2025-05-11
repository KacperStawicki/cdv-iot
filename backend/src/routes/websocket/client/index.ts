import { FastifyPluginAsync } from 'fastify';
import { TokenDecoded } from '../../../utils/types';

const clientRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get(
    '/',
    {
      websocket: true,
      onRequest: [fastify.authenticate],
      schema: {
        tags: ['WebSocket'],
        summary: 'Client WebSocket Endpoint',
        description:
          'WebSocket endpoint for authenticated client applications to receive real-time updates about connected devices. Requires user authentication.',
        security: [{ cookieAuth: [] }],
      },
    },
    (connection, req) => {
      const user = req.user as TokenDecoded;
      const userEmail = user?.email || 'unknown';
      fastify.log.info(
        `Authenticated user ${userEmail} connected to client websocket`
      );

      connection.on('message', async (message: Buffer) => {
        try {
          JSON.parse(message.toString());
          // Handle client messages if needed
        } catch (error) {
          fastify.log.error(error);
        }
      });
    }
  );
};

export default clientRoutes;
