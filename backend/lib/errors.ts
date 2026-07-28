/**
 * Custom error hierarchy for NexoraPOS Backend & Persistence Engine.
 * All error classes prioritize security and never expose sensitive keys or raw cipher data.
 */

export class NexoraError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EncryptionKeyError extends NexoraError {
  constructor(message: string = 'Encryption key configuration is invalid or missing.') {
    super(message, 'ENCRYPTION_KEY_ERROR', 500);
  }
}

export class DecryptionError extends NexoraError {
  constructor(message: string = 'Failed to decrypt persistence file.') {
    super(message, 'DECRYPTION_ERROR', 500);
  }
}

export class CorruptionError extends NexoraError {
  constructor(message: string = 'Persistence state is corrupted or failed validation integrity.') {
    super(message, 'PERSISTENCE_CORRUPTED', 500);
  }
}

export class ValidationError extends NexoraError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

export class NotFoundError extends NexoraError {
  constructor(message: string = 'Requested resource not found.') {
    super(message, 'RESOURCE_NOT_FOUND', 404);
  }
}

export class ConflictError extends NexoraError {
  constructor(message: string = 'Resource conflict detected.') {
    super(message, 'RESOURCE_CONFLICT', 409);
  }
}

export class UnauthorizedError extends NexoraError {
  constructor(message: string = 'Authentication required.') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends NexoraError {
  constructor(message: string = 'Insufficient permissions.') {
    super(message, 'FORBIDDEN', 403);
  }
}
