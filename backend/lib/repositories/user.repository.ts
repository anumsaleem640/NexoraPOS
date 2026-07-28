import { PersistenceEngine } from '../db';
import { User } from '../schema';

export class UserRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<User[]> {
    return this.db.getState().users;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.db.getState().users.find((u) => u.id === id);
    return user || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const targetEmail = email.toLowerCase().trim();
    const user = this.db.getState().users.find((u) => u.email.toLowerCase() === targetEmail);
    return user || null;
  }

  async create(user: User): Promise<User> {
    await this.db.updateState((draft) => {
      draft.users.push(user);
    });
    return user;
  }

  async update(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User | null> {
    let updatedUser: User | null = null;
    await this.db.updateState((draft) => {
      const index = draft.users.findIndex((u) => u.id === id);
      if (index !== -1) {
        draft.users[index] = {
          ...draft.users[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updatedUser = draft.users[index];
      }
    });
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.users.length;
      draft.users = draft.users.filter((u) => u.id !== id);
      deleted = draft.users.length < initialLength;
    });
    return deleted;
  }
}
