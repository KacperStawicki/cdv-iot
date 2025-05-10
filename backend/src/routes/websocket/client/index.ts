import { FastifyPluginAsync } from 'fastify';
import { TokenDecoded } from '../../../utils/types';

const clientRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
  // WebSocket endpoint for user clients (for real-time updates)
  // Add onRequest hook for authentication
  fastify.get('/', { 
    websocket: true,
    onRequest: [fastify.authenticate]
  }, (connection, req) => {
    // Authentication has passed at this point
    // The user info is available in req.user
    const user = req.user as TokenDecoded;
    const userEmail = user?.email || 'unknown';
    fastify.log.info(`Authenticated user ${userEmail} connected to client websocket`);
    
    connection.on('message', async (message: Buffer) => {
      try {
        JSON.parse(message.toString());
        // Handle client messages if needed
      } catch (error) {
        fastify.log.error(error);
      }
    });
  });
};

export default clientRoutes; 