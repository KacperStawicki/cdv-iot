import 'fastify';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Transporter, SendMailOptions } from 'nodemailer';
import { FastifyPluginCallback } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { JWT } from '@fastify/jwt';
import { FastifyRedis } from '@fastify/redis';
import Stripe from 'stripe';
import { TokenDecoded } from '../utils/types';

declare module 'fastify-mailer' {
  import { FastifyPluginCallback } from 'fastify';
  const plugin: FastifyPluginCallback;
  export default plugin;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authenticate_device: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
    refresh: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;

    axios: AxiosInstance;
    prismaClient: PrismaClient;

    // JWT decorator
    jwt: JWT;
  }

  interface FastifyRequest {
    jwt: JWT;
    user?: TokenDecoded;
  }
}

declare module 'fastify-axios' {
  const fastifyAxios: FastifyPluginCallback;
  export default fastifyAxios;
}
