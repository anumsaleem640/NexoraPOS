import { PersistenceEngine } from '../db';
import { Category } from '../schema';

export class CategoryRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<Category[]> {
    return this.db.getState().categories;
  }

  async findById(id: string): Promise<Category | null> {
    const category = this.db.getState().categories.find((c) => c.id === id);
    return category || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const targetSlug = slug.toLowerCase().trim();
    const category = this.db.getState().categories.find((c) => c.slug.toLowerCase() === targetSlug);
    return category || null;
  }

  async create(category: Category): Promise<Category> {
    await this.db.updateState((draft) => {
      draft.categories.push(category);
    });
    return category;
  }

  async update(id: string, updates: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category | null> {
    let updatedCategory: Category | null = null;
    await this.db.updateState((draft) => {
      const index = draft.categories.findIndex((c) => c.id === id);
      if (index !== -1) {
        draft.categories[index] = {
          ...draft.categories[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updatedCategory = draft.categories[index];
      }
    });
    return updatedCategory;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.categories.length;
      draft.categories = draft.categories.filter((c) => c.id !== id);
      deleted = draft.categories.length < initialLength;
    });
    return deleted;
  }
}
