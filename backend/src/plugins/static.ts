import fp from 'fastify-plugin';
import fastifyStatic from '@fastify/static';
import { join } from 'path';

export default fp(async (fastify) => {
  // Serve static files directly from the websocket directory
  fastify.register(fastifyStatic, {
    root: join(__dirname, '..', 'routes', 'websocket'),
    prefix: '/websocket',
    decorateReply: false // Allow multiple static plugins
  });
}); 