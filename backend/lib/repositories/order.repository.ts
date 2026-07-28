import { PersistenceEngine } from '../db';
import { Order, OrderStatus } from '../schema';

export class OrderRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<Order[]> {
    return this.db.getState().orders;
  }

  async findById(id: string): Promise<Order | null> {
    const order = this.db.getState().orders.find((o) => o.id === id);
    return order || null;
  }

  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    const order = this.db.getState().orders.find((o) => o.orderNumber === orderNumber);
    return order || null;
  }

  async create(order: Order): Promise<Order> {
    await this.db.updateState((draft) => {
      draft.orders.push(order);
    });
    return order;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    let updatedOrder: Order | null = null;
    await this.db.updateState((draft) => {
      const index = draft.orders.findIndex((o) => o.id === id);
      if (index !== -1) {
        draft.orders[index].status = status;
        draft.orders[index].updatedAt = new Date().toISOString();
        updatedOrder = draft.orders[index];
      }
    });
    return updatedOrder;
  }
}
