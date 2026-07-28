import fs from 'node:fs';
import path from 'node:path';
import { validateEncryptionKey, encryptData, decryptData } from './crypto';
import { Mutex } from './mutex';
import { DatabaseState, createEmptyDatabase, validateDatabaseState } from './schema';
import { CorruptionError } from './errors';

export class PersistenceEngine {
  private static instance: PersistenceEngine | null = null;
  private filePath: string;
  private tmpFilePath: string;
  private backupFilePath: string;
  private keyBuffer: Buffer;
  private state: DatabaseState;
  private mutex: Mutex;
  private initialized: boolean = false;

  constructor(customFilePath?: string, customRawKey?: string) {
    this.filePath = customFilePath ?? process.env.DATA_FILE_PATH ?? path.join(process.cwd(), 'data.enc');
    this.tmpFilePath = `${this.filePath}.tmp`;
    this.backupFilePath = `${this.filePath}.bak.1`;
    this.keyBuffer = validateEncryptionKey(customRawKey);
    this.mutex = new Mutex();
    this.state = createEmptyDatabase();
  }

  /**
   * Returns singleton instance or creates new one.
   */
  public static getInstance(): PersistenceEngine {
    if (!PersistenceEngine.instance) {
      PersistenceEngine.instance = new PersistenceEngine();
    }
    return PersistenceEngine.instance;
  }

  /**
   * Reset instance (useful for testing).
   */
  public static resetInstance(): void {
    PersistenceEngine.instance = null;
  }

  /**
   * Initializes persistent storage: loads data from data.enc or creates initial data.enc.
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.mutex.runExclusive(async () => {
      if (fs.existsSync(this.filePath)) {
        try {
          const encryptedBuf = fs.readFileSync(this.filePath);
          const decryptedBuf = decryptData(encryptedBuf, this.keyBuffer);
          const parsed = JSON.parse(decryptedBuf.toString('utf-8'));
          this.state = validateDatabaseState(parsed);
        } catch (err: unknown) {
          // Log safe diagnostic (no secrets)
          console.error('[PersistenceEngine] Failed to load persistence file:', (err as Error).message);
          throw new CorruptionError(`Database startup failed. Persistent storage at ${path.basename(this.filePath)} is corrupted or unreadable.`);
        }
      } else {
        // Initial creation of empty database file
        this.state = createEmptyDatabase();
        await this.writeAtomicState(this.state);
      }
      this.initialized = true;
    });
  }

  /**
   * Gets a read-only copy of current in-memory database state.
   */
  public getState(): Readonly<DatabaseState> {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Performs an atomic state mutation under Mutex lock.
   */
  public async updateState(mutator: (draft: DatabaseState) => void): Promise<DatabaseState> {
    return await this.mutex.runExclusive(async () => {
      // 1. Clone current state into draft
      const draft: DatabaseState = JSON.parse(JSON.stringify(this.state));

      // 2. Apply mutation
      mutator(draft);

      // 3. Validate new draft state
      const validated = validateDatabaseState(draft);

      // 4. Atomically persist to disk
      await this.writeAtomicState(validated);

      // 5. Update in-memory state on success
      this.state = validated;
      return JSON.parse(JSON.stringify(this.state));
    });
  }

  /**
   * Writes state atomically:
   * Serialize -> Encrypt -> Write data.enc.tmp -> Sync -> Backup -> Rename to data.enc
   */
  private async writeAtomicState(state: DatabaseState): Promise<void> {
    const jsonString = JSON.stringify(state, null, 2);
    const jsonBuffer = Buffer.from(jsonString, 'utf-8');
    const encryptedBuffer = encryptData(jsonBuffer, this.keyBuffer);

    // 1. Write to temporary file
    fs.writeFileSync(this.tmpFilePath, encryptedBuffer);

    // 2. Sync to storage hardware
    try {
      const fd = fs.openSync(this.tmpFilePath, 'r+');
      fs.fdatasyncSync(fd);
      fs.closeSync(fd);
    } catch {
      // Ignore sync errors if platform lacks fdatasync
    }

    // 3. Create rotating backup of current primary file if it exists
    if (fs.existsSync(this.filePath)) {
      try {
        fs.copyFileSync(this.filePath, this.backupFilePath);
      } catch (err: unknown) {
        console.warn('[PersistenceEngine] Failed to create backup file:', (err as Error).message);
      }
    }

    // 4. Atomic OS rename swap
    fs.renameSync(this.tmpFilePath, this.filePath);
  }
}
