import { FastifyInstance } from 'fastify';

export async function generateAccessToken(
  email: string,
  fastify: FastifyInstance
) {
  const user = await fastify.prismaClient.user.findUnique({
    where: { email },
  });

  if (!user) {
    return null;
  }

  const accessToken = await fastify.jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    { expiresIn: '24h' }
  );

  return accessToken;
}
