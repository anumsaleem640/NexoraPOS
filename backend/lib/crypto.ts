import crypto from 'node:crypto';
import { EncryptionKeyError, DecryptionError, CorruptionError } from './errors';

// File envelope constants
export const MAGIC_HEADER = Buffer.from('NEXORAPO', 'utf-8'); // 8 bytes
export const FORMAT_VERSION = 1; // 4 bytes (UInt32BE)
export const IV_LENGTH = 16; // 16 bytes for AES-256-CBC
export const HMAC_LENGTH = 32; // 32 bytes for SHA-256 HMAC
export const HEADER_MIN_LENGTH = MAGIC_HEADER.length + 4 + IV_LENGTH + HMAC_LENGTH; // 60 bytes

/**
 * Validates process.env.ENCRYPTION_KEY or a passed key.
 * Must be at least 32 bytes in length.
 * Throws EncryptionKeyError on invalid/missing key without exposing secret content.
 */
export function validateEncryptionKey(rawKey?: string): Buffer {
  const key = rawKey ?? process.env.ENCRYPTION_KEY;

  if (!key || typeof key !== 'string') {
    throw new EncryptionKeyError('ENCRYPTION_KEY environment variable is missing or invalid.');
  }

  const keyBuffer = Buffer.from(key, 'utf-8');
  if (keyBuffer.length < 32) {
    throw new EncryptionKeyError('ENCRYPTION_KEY must be at least 32 bytes long.');
  }

  // Derive 32-byte raw key buffer
  return crypto.createHash('sha256').update(keyBuffer).digest();
}

/**
 * Derive encryption key and mac key from master key using SHA-256.
 */
function deriveKeys(masterKey: Buffer): { encKey: Buffer; macKey: Buffer } {
  const encKey = crypto.createHmac('sha256', masterKey).update('nexorapos-encryption-key').digest();
  const macKey = crypto.createHmac('sha256', masterKey).update('nexorapos-hmac-key').digest();
  return { encKey, macKey };
}

/**
 * Encrypts data buffer into NEXORAPO file envelope.
 * Envelope: MAGIC (8B) | VERSION (4B) | IV (16B) | HMAC (32B) | CIPHERTEXT
 */
export function encryptData(dataBuffer: Buffer, keyBuffer: Buffer): Buffer {
  const { encKey, macKey } = deriveKeys(keyBuffer);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  const ciphertext = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

  // Version buffer
  const versionBuf = Buffer.alloc(4);
  versionBuf.writeUInt32BE(FORMAT_VERSION, 0);

  // Compute HMAC over MAGIC + VERSION + IV + CIPHERTEXT
  const hmacInput = Buffer.concat([MAGIC_HEADER, versionBuf, iv, ciphertext]);
  const hmac = crypto.createHmac('sha256', macKey).update(hmacInput).digest();

  // Combine full envelope
  return Buffer.concat([MAGIC_HEADER, versionBuf, iv, hmac, ciphertext]);
}

/**
 * Decrypts file envelope buffer back into unencrypted data buffer.
 * Performs envelope header validation and HMAC-SHA256 authentication.
 */
export function decryptData(envelopeBuffer: Buffer, keyBuffer: Buffer): Buffer {
  if (!envelopeBuffer || envelopeBuffer.length < HEADER_MIN_LENGTH) {
    throw new CorruptionError('Encrypted file envelope is missing or invalid (file too short).');
  }

  // 1. Verify Magic Header
  const magic = envelopeBuffer.subarray(0, 8);
  if (!magic.equals(MAGIC_HEADER)) {
    throw new CorruptionError('Invalid file magic header. Data file is not a valid NexoraPOS database.');
  }

  // 2. Read Version
  const version = envelopeBuffer.readUInt32BE(8);
  if (version !== FORMAT_VERSION) {
    throw new CorruptionError(`Unsupported database envelope version (${version}). Expected version ${FORMAT_VERSION}.`);
  }

  // 3. Extract IV, HMAC, Ciphertext
  const iv = envelopeBuffer.subarray(12, 28);
  const fileHmac = envelopeBuffer.subarray(28, 60);
  const ciphertext = envelopeBuffer.subarray(60);

  const { encKey, macKey } = deriveKeys(keyBuffer);

  // Re-create Version Buffer
  const versionBuf = Buffer.alloc(4);
  versionBuf.writeUInt32BE(version, 0);

  // 4. Verify HMAC Integrity (Constant Time)
  const hmacInput = Buffer.concat([MAGIC_HEADER, versionBuf, iv, ciphertext]);
  const computedHmac = crypto.createHmac('sha256', macKey).update(hmacInput).digest();

  if (!crypto.timingSafeEqual(fileHmac, computedHmac)) {
    throw new CorruptionError('Data integrity validation failed (HMAC mismatch). File may be corrupted or tampered with.');
  }

  // 5. Decrypt Ciphertext
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err: unknown) {
    throw new DecryptionError(`Decryption failed: ${(err as Error).message}`);
  }
}
