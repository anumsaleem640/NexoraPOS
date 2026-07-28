import { describe, it, expect } from 'vitest';
import { validateEncryptionKey, encryptData, decryptData, MAGIC_HEADER } from '../lib/crypto';
import { EncryptionKeyError, CorruptionError } from '../lib/errors';

describe('Encryption & Crypto Layer', () => {
  const validKey = '0123456789abcdef0123456789abcdef'; // 32 bytes

  it('validates a valid 32-byte ENCRYPTION_KEY', () => {
    const keyBuf = validateEncryptionKey(validKey);
    expect(keyBuf).toBeInstanceOf(Buffer);
    expect(keyBuf.length).toBe(32);
  });

  it('fails safely when ENCRYPTION_KEY is missing', () => {
    expect(() => validateEncryptionKey(undefined)).toThrow(EncryptionKeyError);
  });

  it('fails safely when ENCRYPTION_KEY is less than 32 bytes', () => {
    expect(() => validateEncryptionKey('short_key_12345')).toThrow(EncryptionKeyError);
  });

  it('does not expose secrets in error messages', () => {
    try {
      validateEncryptionKey('too_short_key');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      expect(msg).not.toContain('too_short_key');
    }
  });

  it('performs clean encryption and decryption round trips', () => {
    const keyBuf = validateEncryptionKey(validKey);
    const originalPayload = Buffer.from(JSON.stringify({ hello: 'world', count: 42 }));

    const envelope = encryptData(originalPayload, keyBuf);
    expect(envelope.length).toBeGreaterThan(60);
    expect(envelope.subarray(0, 8).equals(MAGIC_HEADER)).toBe(true);

    const decrypted = decryptData(envelope, keyBuf);
    expect(decrypted.toString('utf-8')).toBe(originalPayload.toString('utf-8'));
  });

  it('generates unique random IVs for repeated encryptions', () => {
    const keyBuf = validateEncryptionKey(validKey);
    const payload = Buffer.from('identical data');

    const envelope1 = encryptData(payload, keyBuf);
    const envelope2 = encryptData(payload, keyBuf);

    // IV is located at bytes 12..28
    const iv1 = envelope1.subarray(12, 28);
    const iv2 = envelope2.subarray(12, 28);

    expect(iv1.equals(iv2)).toBe(false);
  });

  it('detects tampering and throws CorruptionError', () => {
    const keyBuf = validateEncryptionKey(validKey);
    const payload = Buffer.from('integrity test');
    const envelope = encryptData(payload, keyBuf);

    // Tamper with the ciphertext byte at index 65
    envelope[65] = envelope[65] ^ 0xff;

    expect(() => decryptData(envelope, keyBuf)).toThrow(CorruptionError);
  });
});
