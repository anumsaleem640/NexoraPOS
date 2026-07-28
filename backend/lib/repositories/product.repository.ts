import { PersistenceEngine } from '../db';
import { Product } from '../schema';

export class ProductRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<Product[]> {
    return this.db.getState().products;
  }

  async findById(id: string): Promise<Product | null> {
    const product = this.db.getState().products.find((p) => p.id === id);
    return product || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const targetSku = sku.toUpperCase().trim();
    const product = this.db.getState().products.find((p) => p.sku.toUpperCase() === targetSku);
    return product || null;
  }

  async findByCategoryId(categoryId: string): Promise<Product[]> {
    return this.db.getState().products.filter((p) => p.categoryId === categoryId);
  }

  async create(product: Product): Promise<Product> {
    await this.db.updateState((draft) => {
      draft.products.push(product);
    });
    return product;
  }

  async update(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product | null> {
    let updatedProduct: Product | null = null;
    await this.db.updateState((draft) => {
      const index = draft.products.findIndex((p) => p.id === id);
      if (index !== -1) {
        draft.products[index] = {
          ...draft.products[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updatedProduct = draft.products[index];
      }
    });
    return updatedProduct;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.products.length;
      draft.products = draft.products.filter((p) => p.id !== id);
      deleted = draft.products.length < initialLength;
    });
    return deleted;
  }
}
