import { FastifyInstance } from 'fastify';

export async function generateRefreshToken(
  email: string,
  fastify: FastifyInstance
) {
  const user = await fastify.prismaClient.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const refreshToken = await fastify.jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    { expiresIn: '7d' }
  );

  return refreshToken;
}
