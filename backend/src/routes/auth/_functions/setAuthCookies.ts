import { FastifyReply } from 'fastify';

export const setAuthCookies = (
  reply: FastifyReply,
  options: {
    accessToken?: string;
  }
) => {
  const { accessToken } = options;

  if (accessToken) {
    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'none',
      maxAge: 60 * 60 * 24, // 24 Hours
    });
  }
};
