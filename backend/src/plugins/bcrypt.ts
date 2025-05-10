import fp from 'fastify-plugin';
import fastifyBcrypt from 'fastify-bcrypt';

/**
 * This plugin adds bcrypt hashing and comparison utilities to Fastify
 */
export default fp(async (fastify) => {
  fastify.register(fastifyBcrypt, {
    saltWorkFactor: 10, // Set your desired salt rounds (default is 10)
  });
});
