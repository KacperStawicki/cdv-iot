export type TokenDecoded = {
  id: string;
  email: string;
  emailVerified: boolean;
  twoFaEnabled: boolean;
  twoFaVerified: boolean;
};

export type RefreshTokenDecoded = {
  id: string;
  email: string;
};