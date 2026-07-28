import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PersistenceEngine } from '../lib/db';
import { CorruptionError } from '../lib/errors';

describe('PersistenceEngine (File Encryption, Atomic Swaps, Mutex, Corruption)', () => {
  let testDir: string;
  let testFilePath: string;
  let testTmpPath: string;
  const testKey = '0123456789abcdef0123456789abcdef';

  beforeEach(() => {
    PersistenceEngine.resetInstance();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora-test-'));
    testFilePath = path.join(testDir, 'test_data.enc');
    testTmpPath = `${testFilePath}.tmp`;
  });

  afterEach(() => {
    PersistenceEngine.resetInstance();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('initializes and creates data.enc when file does not exist', async () => {
    const engine = new PersistenceEngine(testFilePath, testKey);
    await engine.initialize();

    expect(fs.existsSync(testFilePath)).toBe(true);
    expect(fs.existsSync(testTmpPath)).toBe(false);

    const state = engine.getState();
    expect(state.version).toBe(1);
    expect(state.users).toEqual([]);
    expect(state.settings.storeName).toBe('NexoraPOS Store');
  });

  it('performs atomic writes and clean state updates', async () => {
    const engine = new PersistenceEngine(testFilePath, testKey);
    await engine.initialize();

    await engine.updateState((draft) => {
      draft.users.push({
        id: 'usr_1',
        email: 'admin@nexorapos.com',
        passwordHash: 'hashed_secret',
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    expect(fs.existsSync(testTmpPath)).toBe(false);

    // Re-instantiate engine to verify persisted data reloading
    PersistenceEngine.resetInstance();
    const engine2 = new PersistenceEngine(testFilePath, testKey);
    await engine2.initialize();

    const state = engine2.getState();
    expect(state.users.length).toBe(1);
    expect(state.users[0].email).toBe('admin@nexorapos.com');
  });

  it('handles 50 concurrent writes without lost updates or race conditions', async () => {
    const engine = new PersistenceEngine(testFilePath, testKey);
    await engine.initialize();

    const writeTasks = Array.from({ length: 50 }).map((_, index) =>
      engine.updateState((draft) => {
        draft.categories.push({
          id: `cat_${index}`,
          name: `Category ${index}`,
          slug: `category-${index}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      })
    );

    await Promise.all(writeTasks);

    const state = engine.getState();
    expect(state.categories.length).toBe(50);
  });

  it('refuses to load corrupted data.enc and preserves original file', async () => {
    // Write corrupted garbage data to testFilePath
    fs.writeFileSync(testFilePath, Buffer.from('CORRUPTED_GARBAGE_DATA_1234567890_EXPLICIT_PADDING'));

    const engine = new PersistenceEngine(testFilePath, testKey);
    await expect(engine.initialize()).rejects.toThrow(CorruptionError);

    // File must still exist and not be silently reset
    expect(fs.existsSync(testFilePath)).toBe(true);
    const content = fs.readFileSync(testFilePath);
    expect(content.toString()).toContain('CORRUPTED_GARBAGE_DATA');
  });
});
