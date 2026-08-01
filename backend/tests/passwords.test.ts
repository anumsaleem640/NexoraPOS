import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePasswordPolicy } from '../lib/passwords';
import { ValidationError } from '../lib/errors';

describe('Password Hashing & Verification Layer', () => {
  it('validates password complexity (minimum 8 characters)', () => {
    expect(() => validatePasswordPolicy('short')).toThrow(ValidationError);
    expect(() => validatePasswordPolicy('12345678')).not.toThrow();
  });

  it('hashes password securely with scrypt and random salt', async () => {
    const rawPassword = 'SecurePassword123!';
    const hash = await hashPassword(rawPassword);

    expect(hash).toContain('scrypt:');
    expect(hash).not.toEqual(rawPassword);
    expect(hash).not.toContain(rawPassword);
  });

  it('verifies correct password against hash', async () => {
    const rawPassword = 'MySecretPassword!';
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password safely', async () => {
    const hash = await hashPassword('CorrectPassword123');

    const isValid = await verifyPassword('WrongPassword123', hash);
    expect(isValid).toBe(false);
  });

  it('handles invalid or corrupted stored hash formats gracefully', async () => {
    const isValid = await verifyPassword('Password123', 'invalid:hash:format');
    expect(isValid).toBe(false);
  });
});
