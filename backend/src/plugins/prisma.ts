import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';

// We'll use camelCase for variables interacting with the backend
const prismaClient = new PrismaClient();

// This plugin attaches the Prisma client to the Fastify instance
export default fp(async (fastifyApp) => {
  fastifyApp.decorate('prismaClient', prismaClient);

  fastifyApp.addHook('onClose', async (instance) => {
    await instance.prismaClient.$disconnect();
  });
});
