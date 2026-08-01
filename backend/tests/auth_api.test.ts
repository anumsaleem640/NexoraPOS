import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PersistenceEngine } from '../lib/db';
import { POST as loginHandler } from '../app/api/v1/auth/login/route';
import { POST as logoutHandler } from '../app/api/v1/auth/logout/route';
import { GET as meHandler } from '../app/api/v1/auth/me/route';

describe('Authentication API Route Handlers (/api/v1/auth/*)', () => {
  let testDir: string;
  let testFilePath: string;
  const testKey = '0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    PersistenceEngine.resetInstance();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora-api-test-'));
    testFilePath = path.join(testDir, 'data.enc');
    process.env.DATA_FILE_PATH = testFilePath;
    process.env.ENCRYPTION_KEY = testKey;
    const db = new PersistenceEngine(testFilePath, testKey);
    await db.initialize();
  });

  afterEach(() => {
    PersistenceEngine.resetInstance();
    delete process.env.DATA_FILE_PATH;
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('POST /api/v1/auth/login succeeds with seeded admin credentials', async () => {
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexorapos.com',
        password: 'AdminPassword123!',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.user.email).toBe('admin@nexorapos.com');
    expect(body.data.user.role).toBe('admin');
    expect(body.data.user).not.toHaveProperty('passwordHash');
    expect(body.data.token).toBeDefined();
  });

  it('POST /api/v1/auth/login fails safely with wrong password (401)', async () => {
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexorapos.com',
        password: 'WrongPassword!',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.message).toBe('Invalid email or password.');
  });

  it('POST /api/v1/auth/login fails safely with non-existent email (401)', async () => {
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unknown@nexorapos.com',
        password: 'AdminPassword123!',
      }),
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
    expect(body.error.message).toBe('Invalid email or password.');
  });

  it('GET /api/v1/auth/me returns current user profile when authenticated', async () => {
    // 1. Login
    const loginReq = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexorapos.com',
        password: 'AdminPassword123!',
      }),
    });
    const loginRes = await loginHandler(loginReq);
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    // 2. Query /me
    const meReq = new Request('http://localhost/api/v1/auth/me', {
      headers: { authorization: `Bearer ${token}` },
    });
    const meRes = await meHandler(meReq);
    expect(meRes.status).toBe(200);

    const meData = await meRes.json();
    expect(meData.success).toBe(true);
    expect(meData.data.user.email).toBe('admin@nexorapos.com');
    expect(meData.data.user).not.toHaveProperty('passwordHash');
  });

  it('POST /api/v1/auth/logout invalidates session token', async () => {
    // 1. Login
    const loginReq = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@nexorapos.com',
        password: 'AdminPassword123!',
      }),
    });
    const loginRes = await loginHandler(loginReq);
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    // 2. Logout
    const logoutReq = new Request('http://localhost/api/v1/auth/logout', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
    });
    const logoutRes = await logoutHandler(logoutReq);
    expect(logoutRes.status).toBe(200);

    // 3. Query /me after logout should return 401
    const meReq = new Request('http://localhost/api/v1/auth/me', {
      headers: { authorization: `Bearer ${token}` },
    });
    const meRes = await meHandler(meReq);
    expect(meRes.status).toBe(401);
  });
});
