import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

export default fp(async (fastify) => {
  const allowedOrigins: string[] =
    process.env.NODE_ENV === 'production' && process.env.FRONTEND_URL
      ? [process.env.FRONTEND_URL] // Ensure it's a valid string
      : ['http://localhost:3000', 'http://localhost:8080']; // Development origin fallback

  fastify.register(cors, {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow: boolean | string[]) => void
    ) => {
      // Allow requests with no origin (e.g., server-to-server requests)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, allowedOrigins);
      } else {
        callback(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true, // Allow cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
    preflight: true, // Ensure OPTIONS is handled
  } as FastifyCorsOptions);
});
