import { FastifyReply } from 'fastify';

export const setAuthCookies = (
  reply: FastifyReply,
  options: {
    accessToken?: string;
    refreshToken?: string;
  }
) => {
  const { accessToken, refreshToken } = options;

  if (accessToken) {
    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      domain: process.env.DOMAIN,
      maxAge: 60 * 15, // 15 Minutes
    });
  }

  if (refreshToken) {
    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
      domain: process.env.DOMAIN,
      maxAge: 7 * 24 * 60 * 60, // 7 Days
    });
  }
};
