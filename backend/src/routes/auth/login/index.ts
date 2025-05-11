import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { generateAccessToken } from '../_functions/generateAccessToken';
import { setAuthCookies } from '../_functions/setAuthCookies';

const login: FastifyPluginAsyncZod = async (fastify) => {
  // Zod schema for request validation
  const loginSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    password: z.string().min(10, { message: 'Invalid password format' }),
  });

  fastify.post(
    '',
    {
      schema: {
        body: loginSchema,
        response: {
          200: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
        tags: ['Authentication'],
        summary: 'User login',
        description:
          'Authenticates a user with email and password, returning HTTP-only cookies for access and refresh tokens.',
      },
    },
    async (request, reply) => {
      // Validate request body
      const body = loginSchema.parse(request.body);
      const { email, password } = body;

      // Find the user in the database
      const user = await fastify.prismaClient.user.findUnique({
        where: { email },
      });

      if (!user) {
        return reply.status(404).send({ message: 'Invalid credentials' });
      }

      if (!user.password) {
        return reply
          .status(404)
          .send({ message: 'Please use Google/Microsoft for logging in' });
      }

      // Verify the password using fastify-bcrypt
      const isPasswordValid = await fastify.bcrypt.compare(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return reply.status(404).send({ message: 'Invalid credentials' });
      }

      // Generate JWT tokens
      const accessToken = await generateAccessToken(user.email, fastify);

      if (!accessToken) {
        return reply.code(404).send({ message: 'Invalid credentials' });
      }

      // Set the tokens as cookies using the utility function
      setAuthCookies(reply, { accessToken });

      return reply.code(200).send({
        message: 'Login successful',
      });
    }
  );
};

export default login;
