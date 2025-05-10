import fastifyAxios from 'fastify-axios';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.register(fastifyAxios);
});
