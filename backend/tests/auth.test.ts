import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PersistenceEngine } from '../lib/db';
import { UserRepository, SessionRepository } from '../lib/repositories';
import {
  toSafeUser,
  createSession,
  getAuthenticatedUser,
  requireAuth,
  requirePermission,
  hasPermission,
} from '../lib/auth';
import { User, Session } from '../lib/schema';
import { UnauthorizedError, ForbiddenError } from '../lib/errors';

describe('Authentication & Authorization Infrastructure', () => {
  let testDir: string;
  let testFilePath: string;
  let engine: PersistenceEngine;
  const testKey = '0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    PersistenceEngine.resetInstance();
    process.env.ENCRYPTION_KEY = testKey;
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora-auth-test-'));
    testFilePath = path.join(testDir, 'data.enc');
    process.env.DATA_FILE_PATH = testFilePath;
    engine = PersistenceEngine.getInstance(testFilePath, testKey);
    await engine.initialize();
  });

  afterEach(() => {
    PersistenceEngine.resetInstance();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('toSafeUser strips passwordHash', () => {
    const fullUser: User = {
      id: 'usr_1',
      email: 'user@nexora.com',
      passwordHash: 'scrypt:secret:hash',
      name: 'Test User',
      role: 'cashier',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const safe = toSafeUser(fullUser);
    expect(safe).not.toHaveProperty('passwordHash');
    expect(safe.email).toBe('user@nexora.com');
    expect(safe.role).toBe('cashier');
  });

  it('evaluates role permissions correctly', () => {
    expect(hasPermission('admin', 'anything:create')).toBe(true);
    expect(hasPermission('manager', 'products:create')).toBe(true);
    expect(hasPermission('manager', 'users:delete')).toBe(false);
    expect(hasPermission('cashier', 'products:read')).toBe(true);
    expect(hasPermission('cashier', 'products:create')).toBe(false);
  });

  it('creates sessions and resolves authenticated users', async () => {
    const userRepo = new UserRepository(engine);
    const user = await userRepo.create({
      id: 'usr_cashier_1',
      email: 'cashier1@nexora.com',
      passwordHash: 'scrypt:hash:val',
      name: 'Bob Cashier',
      role: 'cashier',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const session = await createSession(user.id);
    expect(session.token).toBeDefined();

    const req = new Request('http://localhost/api/v1/auth/me', {
      headers: { authorization: `Bearer ${session.token}` },
    });

    const auth = await getAuthenticatedUser(req);
    expect(auth).not.toBeNull();
    expect(auth?.user.id).toBe('usr_cashier_1');
    expect(auth?.safeUser).not.toHaveProperty('passwordHash');
  });

  it('rejects expired sessions and cleans them up', async () => {
    const sessionRepo = new SessionRepository(engine);
    const expiredSession: Session = {
      id: 'sess_exp_1',
      userId: 'usr_admin_initial',
      token: 'expired_token_123',
      expiresAt: new Date(Date.now() - 10000).toISOString(), // Past
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    };
    await sessionRepo.create(expiredSession);

    const req = new Request('http://localhost/api/v1/auth/me', {
      headers: { authorization: 'Bearer expired_token_123' },
    });

    const auth = await getAuthenticatedUser(req);
    expect(auth).toBeNull();

    // Expired session should be removed
    const found = await sessionRepo.findByToken('expired_token_123');
    expect(found).toBeNull();
  });

  it('requireAuth and requirePermission guards enforce server-side security', async () => {
    const userRepo = new UserRepository(engine);
    const cashierUser = await userRepo.create({
      id: 'usr_cashier_2',
      email: 'cashier2@nexora.com',
      passwordHash: 'scrypt:hash:val',
      name: 'Alice Cashier',
      role: 'cashier',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const session = await createSession(cashierUser.id);
    const validReq = new Request('http://localhost/api/v1/test', {
      headers: { authorization: `Bearer ${session.token}` },
    });

    // requireAuth passes
    const auth = await requireAuth(validReq);
    expect(auth.user.id).toBe('usr_cashier_2');

    // Cashier reading products passes
    await expect(requirePermission(validReq, 'products:read')).resolves.toBeDefined();

    // Cashier creating products fails with ForbiddenError
    await expect(requirePermission(validReq, 'products:create')).rejects.toThrow(ForbiddenError);

    // Unauthenticated request fails with UnauthorizedError
    const emptyReq = new Request('http://localhost/api/v1/test');
    await expect(requireAuth(emptyReq)).rejects.toThrow(UnauthorizedError);
  });
});
