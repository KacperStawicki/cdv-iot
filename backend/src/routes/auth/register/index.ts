import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

const register: FastifyPluginAsyncZod = async (fastify) => {
  // Zod schema for request validation
  const registerSchema = z.object({
    email: z.string().email({ message: 'Invalid email address' }),
    firstName: z.string(),
    lastName: z.string(),
    password: z
      .string()
      .min(10, { message: 'Password must be at least 10 characters long' })
      .max(100, { message: 'Password must be less than 100 characters long' }),
    passwordConfirmation: z.string(),
  });

  fastify.post(
    '',
    {
      schema: {
        body: registerSchema,
        response: {
          200: z.object({ message: z.string() }),
          400: z.object({ message: z.string() }),
          401: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
        tags: ['Authentication'],
        summary: 'User registration',
        description:
          'Registers a new user with email, first name, last name, and password.',
      },
    },
    async (request, reply) => {
      // Destructure the validated body directly from the request
      const { email, password, passwordConfirmation, firstName, lastName } =
        request.body;

      if (password !== passwordConfirmation) {
        return reply
          .status(400)
          .send({ message: 'Passwords are not identical' });
      }

      // Check if the user already exists
      const existingUser = await fastify.prismaClient.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return reply.status(400).send({ message: 'User already exists' });
      }

      // Hash the password using fastify-bcrypt
      const hashedPassword = await fastify.bcrypt.hash(password);

      // Create the user in the database
      await fastify.prismaClient.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
        },
      });

      return reply.status(200).send({
        message: 'User registered successfully',
      });
    }
  );
};

export default register;
