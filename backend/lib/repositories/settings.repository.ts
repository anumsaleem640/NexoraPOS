import { PersistenceEngine } from '../db';
import { Settings } from '../schema';

export class SettingsRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async getSettings(): Promise<Settings> {
    return this.db.getState().settings;
  }

  async updateSettings(updates: Partial<Omit<Settings, 'updatedAt'>>): Promise<Settings> {
    let updatedSettings: Settings;
    await this.db.updateState((draft) => {
      draft.settings = {
        ...draft.settings,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updatedSettings = draft.settings;
    });
    return updatedSettings!;
  }
}
