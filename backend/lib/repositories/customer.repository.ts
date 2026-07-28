import { PersistenceEngine } from '../db';
import { Customer } from '../schema';

export class CustomerRepository {
  constructor(private db: PersistenceEngine = PersistenceEngine.getInstance()) {}

  async findAll(): Promise<Customer[]> {
    return this.db.getState().customers;
  }

  async findById(id: string): Promise<Customer | null> {
    const customer = this.db.getState().customers.find((c) => c.id === id);
    return customer || null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const targetEmail = email.toLowerCase().trim();
    const customer = this.db.getState().customers.find((c) => c.email.toLowerCase() === targetEmail);
    return customer || null;
  }

  async create(customer: Customer): Promise<Customer> {
    await this.db.updateState((draft) => {
      draft.customers.push(customer);
    });
    return customer;
  }

  async update(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Promise<Customer | null> {
    let updatedCustomer: Customer | null = null;
    await this.db.updateState((draft) => {
      const index = draft.customers.findIndex((c) => c.id === id);
      if (index !== -1) {
        draft.customers[index] = {
          ...draft.customers[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        updatedCustomer = draft.customers[index];
      }
    });
    return updatedCustomer;
  }

  async delete(id: string): Promise<boolean> {
    let deleted = false;
    await this.db.updateState((draft) => {
      const initialLength = draft.customers.length;
      draft.customers = draft.customers.filter((c) => c.id !== id);
      deleted = draft.customers.length < initialLength;
    });
    return deleted;
  }
}
