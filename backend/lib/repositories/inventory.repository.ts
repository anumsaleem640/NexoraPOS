import { PersistenceEngine } from '../db';
import { InventoryItem } from '../schema';

export class InventoryRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<InventoryItem[]> {
    return this.db.getState().inventory;
  }

  async findByProductId(productId: string): Promise<InventoryItem | null> {
    const item = this.db.getState().inventory.find((i) => i.productId === productId);
    return item || null;
  }

  async create(item: InventoryItem): Promise<InventoryItem> {
    await this.db.updateState((draft) => {
      draft.inventory.push(item);
    });
    return item;
  }

  async updateStock(productId: string, delta: number): Promise<InventoryItem | null> {
    let updatedItem: InventoryItem | null = null;
    await this.db.updateState((draft) => {
      const index = draft.inventory.findIndex((i) => i.productId === productId);
      if (index !== -1) {
        const currentStock = draft.inventory[index].stockQuantity;
        const newStock = currentStock + delta;
        if (newStock < 0) {
          throw new Error(`Insufficient inventory stock for productId ${productId}. Available: ${currentStock}, Requested delta: ${delta}`);
        }
        draft.inventory[index].stockQuantity = newStock;
        draft.inventory[index].lastAdjustedAt = new Date().toISOString();
        updatedItem = draft.inventory[index];
      }
    });
    return updatedItem;
  }

  async setStock(productId: string, stockQuantity: number, reorderPoint?: number): Promise<InventoryItem> {
    let resultItem: InventoryItem | null = null;
    const now = new Date().toISOString();

    await this.db.updateState((draft) => {
      const index = draft.inventory.findIndex((i) => i.productId === productId);
      if (index !== -1) {
        draft.inventory[index].stockQuantity = stockQuantity;
        if (reorderPoint !== undefined) {
          draft.inventory[index].reorderPoint = reorderPoint;
        }
        draft.inventory[index].lastAdjustedAt = now;
        resultItem = draft.inventory[index];
      } else {
        const newItem: InventoryItem = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          productId,
          stockQuantity,
          reorderPoint: reorderPoint ?? 5,
          lastAdjustedAt: now,
        };
        draft.inventory.push(newItem);
        resultItem = newItem;
      }
    });

    return resultItem!;
  }
}
