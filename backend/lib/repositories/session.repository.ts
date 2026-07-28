import { PersistenceEngine } from '../db';
import { Session } from '../schema';

export class SessionRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findById(id: string): Promise<Session | null> {
    const session = this.db.getState().sessions.find((s) => s.id === id);
    return session || null;
  }

  async findByToken(token: string): Promise<Session | null> {
    const session = this.db.getState().sessions.find((s) => s.token === token);
    return session || null;
  }

  async create(session: Session): Promise<Session> {
    await this.db.updateState((draft) => {
      draft.sessions.push(session);
    });
    return session;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.sessions.length;
      draft.sessions = draft.sessions.filter((s) => s.id !== id);
      deleted = draft.sessions.length < initialLength;
    });
    return deleted;
  }

  async deleteByToken(token: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.sessions.length;
      draft.sessions = draft.sessions.filter((s) => s.token !== token);
      deleted = draft.sessions.length < initialLength;
    });
    return deleted;
  }

  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    let removedCount = 0;
    await this.db.updateState((draft) => {
      const initialCount = draft.sessions.length;
      draft.sessions = draft.sessions.filter((s) => s.expiresAt > now);
      removedCount = initialCount - draft.sessions.length;
    });
    return removedCount;
  }
}
