import fastifyCookie from '@fastify/cookie';
import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.register(fastifyCookie, {
    secret: process.env.JWT_SECRET,
    hook: 'onRequest',
    parseOptions: {},
  });
});
