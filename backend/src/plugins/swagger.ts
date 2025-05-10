import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { FastifyRequest, FastifyReply } from 'fastify';

export default fp(async function (fastify) {
  const ScalarApiReference = await (
    await import('@scalar/fastify-api-reference')
  ).default;

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Backend API',
        version: '1.0.0',
      },
      servers: [
        {
          url:
            process.env.NODE_ENV === 'production'
              ? 'http://localhost:8080'
              : 'http://localhost:8080',
          description:
            process.env.NODE_ENV === 'production'
              ? 'Production server'
              : 'Local server',
        },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'accessToken',
          },
        },
      },
      security: [{ cookieAuth: [] }],
    },
    transform: jsonSchemaTransform,
    hideUntagged: true,
  });

  await fastify.register(ScalarApiReference, {
    routePrefix: '/docs',
    hooks: {
      onRequest: (
        request: FastifyRequest,
        reply: FastifyReply,
        next: () => void
      ) => {
        const auth = { login: 'secretuser', password: 'secretpassword' };

        const b64auth =
          (request.headers.authorization || '').split(' ')[1] || '';
        const [login, password] = Buffer.from(b64auth, 'base64')
          .toString()
          .split(':');

        if (
          login &&
          password &&
          login === auth.login &&
          password === auth.password
        ) {
          return next();
        }

        reply
          .header('WWW-Authenticate', 'Basic realm="401"')
          .status(401)
          .send('Authentication required.');
      },
    },
  });
});
