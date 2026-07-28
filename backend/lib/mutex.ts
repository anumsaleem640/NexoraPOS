/**
 * Async Mutex for serializing database write operations.
 * Prevents race conditions and lost updates across concurrent API requests.
 */
export class Mutex {
  private queue: Array<(release: () => void) => void> = [];
  private locked: boolean = false;

  /**
   * Acquire lock. Resolves to a release function when lock is granted.
   */
  public acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      const dispatch = (release: () => void) => {
        resolve(release);
      };

      if (!this.locked) {
        this.locked = true;
        dispatch(this.createRelease());
      } else {
        this.queue.push(dispatch);
      }
    });
  }

  /**
   * Runs an async action within the lock.
   */
  public async runExclusive<T>(action: () => Promise<T>): Promise<T> {
    const release = await this.acquire();
    try {
      return await action();
    } finally {
      release();
    }
  }

  private createRelease(): () => void {
    return () => {
      if (this.queue.length > 0) {
        const nextDispatch = this.queue.shift()!;
        nextDispatch(this.createRelease());
      } else {
        this.locked = false;
      }
    };
  }
}
