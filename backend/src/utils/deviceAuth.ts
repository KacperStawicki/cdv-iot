import crypto from 'crypto';

/**
 * Generate a random authentication key for a device
 * @returns A random string that can be used as an authentication key
 */
export function generateDeviceAuthKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify the device authentication signature
 * @param deviceId The device ID
 * @param authKey The device authentication key
 * @param timestamp The timestamp of the request (to prevent replay attacks)
 * @param signature The provided signature to verify
 * @returns Whether the signature is valid
 */
export function verifyDeviceSignature(
  deviceId: string,
  authKey: string,
  timestamp: string,
  signature: string
): boolean {
  // Create a signature using MD5 (as requested)
  // In production, a stronger algorithm would be recommended
  const expectedSignature = crypto
    .createHash('md5')
    .update(`${deviceId}:${authKey}:${timestamp}`)
    .digest('hex');

  // Use a constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Generate a signature for testing purposes
 * @param deviceId The device ID
 * @param authKey The device authentication key
 * @param timestamp The timestamp
 * @returns MD5 signature
 */
export function generateSignature(
  deviceId: string,
  authKey: string,
  timestamp: string
): string {
  return crypto
    .createHash('md5')
    .update(`${deviceId}:${authKey}:${timestamp}`)
    .digest('hex');
}
