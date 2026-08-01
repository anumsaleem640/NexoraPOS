import crypto from 'node:crypto';
import { ValidationError } from './errors';

const SALT_SIZE = 16;
const KEY_LEN = 64;

/**
 * Validates password complexity.
 * Minimum 8 characters.
 */
export function validatePasswordPolicy(password: string): void {
  if (!password || typeof password !== 'string') {
    throw new ValidationError('Password must be a non-empty string.');
  }
  if (password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters long.');
  }
}

/**
 * Hashes plaintext password securely using scrypt with random salt.
 * Returns formatted string: scrypt:<salt_hex>:<hash_hex>
 */
export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);

  const salt = crypto.randomBytes(SALT_SIZE);

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, (err, derivedKey) => {
      if (err) return reject(err);
      const saltHex = salt.toString('hex');
      const hashHex = derivedKey.toString('hex');
      resolve(`scrypt:${saltHex}:${hashHex}`);
    });
  });
}

/**
 * Verifies a plaintext password against a stored scrypt hash string.
 * Uses constant-time comparison (crypto.timingSafeEqual) to prevent timing attacks.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;

  const parts = storedHash.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false;
  }

  const salt = Buffer.from(parts[1], 'hex');
  const targetHash = Buffer.from(parts[2], 'hex');

  return new Promise((resolve) => {
    crypto.scrypt(password, salt, targetHash.length, (err, derivedKey) => {
      if (err) return resolve(false);
      try {
        const matches = crypto.timingSafeEqual(targetHash, derivedKey);
        resolve(matches);
      } catch {
        resolve(false);
      }
    });
  });
}
