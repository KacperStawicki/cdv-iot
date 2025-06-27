import { FastifyPluginAsync } from 'fastify';
import { TokenDecoded } from '../../../utils/types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const clientConnections = new Map<string, Set<any>>();

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
      const userId = user.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ws: any = connection; // SocketStream instance with .send and .on

      // Add connection to map
      let set = clientConnections.get(userId);
      if (!set) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        set = new Set<any>();
        clientConnections.set(userId, set);
      }
      set.add(ws);

      fastify.log.info(`User ${user.email} connected to client websocket`);

      ws.on('close', () => {
        set?.delete(ws);
        if (set && set.size === 0) {
          clientConnections.delete(userId);
        }
        fastify.log.info(`Client websocket for user ${user.email} closed`);
      });

      ws.on('message', async (message: Buffer) => {
        try {
          JSON.parse(message.toString());
          // Handle client messages if needed in future
        } catch (error) {
          fastify.log.error(error);
        }
      });
    }
  );
};

export default clientRoutes;
