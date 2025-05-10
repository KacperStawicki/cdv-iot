import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform } from 'fastify-type-provider-zod';
import { FastifyRequest, FastifyReply } from 'fastify';

interface SwaggerMethodConfig {
  tags?: string[];
  [key: string]: unknown;
}

interface SwaggerPathMethods {
  [method: string]: SwaggerMethodConfig;
}

interface SwaggerPaths {
  [path: string]: SwaggerPathMethods;
}

interface SwaggerSpec {
  paths: SwaggerPaths;
  [key: string]: unknown;
}

export default fp(async function (fastify) {
  const ScalarApiReference = await (
    await import('@scalar/fastify-api-reference')
  ).default;

  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'Raterunners API',
        version: '1.0.0',
      },
      servers: [
        {
          url:
            process.env.NODE_ENV === 'production'
              ? 'https://api.raterunners.com'
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

  await fastify.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      filter: true,
    },
    transformSpecification: (swaggerObject: Record<string, SwaggerSpec>) => {
      if (!swaggerObject.paths) return swaggerObject;

      const paths = Object.entries(swaggerObject.paths).reduce(
        (acc, [path, methods]) => {
          if (path.startsWith('/external')) {
            acc[path] = methods as SwaggerPathMethods;
          }
          return acc;
        },
        {} as SwaggerPaths
      );

      return {
        ...swaggerObject,
        paths,
      };
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  await fastify.register(ScalarApiReference, {
    routePrefix: '/docs/internal',
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
