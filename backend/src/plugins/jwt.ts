import fastifyJwt from '@fastify/jwt';
import { FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { RefreshTokenDecoded, TokenDecoded } from '../utils/types';
import { Device } from '@prisma/client';

// Define types for request with device
interface RequestWithDevice extends FastifyRequest {
  device?: Device;
}

export default fp(async (fastify) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET,
  });

  fastify.addHook('preHandler', (req, res, next) => {
    req.jwt = fastify.jwt;
    return next();
  });

  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = await request.cookies.accessToken;

      if (!token) {
        return reply.status(401).send({ message: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify<TokenDecoded>(token);

      if (!decoded) {
        return reply.status(401).send({ message: 'Access token expired' });
      }

      request.user = decoded;
    }
  );

  fastify.decorate(
    'authenticate_device',
    async (request: FastifyRequest, reply: FastifyReply) => {
      // First, authenticate the user
      const token = await request.cookies.accessToken;

      if (!token) {
        return reply.status(401).send({ message: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify<TokenDecoded>(token);

      if (!decoded) {
        return reply.status(401).send({ message: 'Access token expired' });
      }

      request.user = decoded;

      // Then, check if the device belongs to the user
      // Try to get deviceId from different possible locations
      let deviceId: string | undefined;

      // From route params (e.g., /devices/:deviceId)
      if (request.params && typeof request.params === 'object') {
        deviceId = (request.params as Record<string, string>).deviceId;
      }

      // From query params (e.g., ?deviceId=123)
      if (!deviceId && request.query && typeof request.query === 'object') {
        deviceId = (request.query as Record<string, string>).deviceId;
      }

      // From request body (e.g., POST with deviceId in body)
      if (!deviceId && request.body && typeof request.body === 'object') {
        deviceId = (request.body as Record<string, string>).deviceId;
      }

      if (!deviceId) {
        return reply.status(400).send({ message: 'Device ID is required' });
      }

      // Look up the device in the database
      try {
        const device = await fastify.prismaClient.device.findUnique({
          where: { id: deviceId },
          include: { user: true },
        });

        if (!device) {
          return reply.status(404).send({ message: 'Device not found' });
        }

        // Check if the device belongs to the authenticated user
        if (!device.user || device.user.email !== decoded.email) {
          return reply.status(403).send({
            message: 'You do not have permission to access this device',
          });
        }

        // Add the device to the request for use in route handlers
        (request as RequestWithDevice).device = device;
      } catch (error) {
        fastify.log.error('Error verifying device ownership:', error);
        return reply
          .status(500)
          .send({ message: 'Error verifying device ownership' });
      }
    }
  );

  fastify.decorate(
    'refresh',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = request.cookies.refreshToken;

      if (!token) {
        return reply.status(401).send({ message: 'Authentication required' });
      }

      const decoded = fastify.jwt.verify<RefreshTokenDecoded>(token);

      if (!decoded) {
        return reply.status(401).send({ message: 'Refresh token expired' });
      }

      request.user = decoded;
    }
  );
});
