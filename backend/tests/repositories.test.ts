import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { PersistenceEngine } from '../lib/db';
import {
  UserRepository,
  SessionRepository,
  ProductRepository,
  CategoryRepository,
  InventoryRepository,
  OrderRepository,
  CustomerRepository,
  SettingsRepository,
} from '../lib/repositories';

describe('Domain Repositories Suite', () => {
  let testDir: string;
  let testFilePath: string;
  let engine: PersistenceEngine;
  const testKey = '0123456789abcdef0123456789abcdef';

  beforeEach(async () => {
    PersistenceEngine.resetInstance();
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'nexora-repo-test-'));
    testFilePath = path.join(testDir, 'data.enc');
    engine = new PersistenceEngine(testFilePath, testKey);
    await engine.initialize();
  });

  afterEach(() => {
    PersistenceEngine.resetInstance();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('UserRepository CRUD operations', async () => {
    const repo = new UserRepository(engine);
    const user = await repo.create({
      id: 'usr_100',
      email: 'test@nexorapos.com',
      passwordHash: 'hash_123',
      name: 'Jane Doe',
      role: 'cashier',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(user.id).toBe('usr_100');
    expect(await repo.findByEmail('TEST@NEXORAPOS.COM')).not.toBeNull();

    const updated = await repo.update('usr_100', { name: 'Jane Smith' });
    expect(updated?.name).toBe('Jane Smith');

    const deleted = await repo.delete('usr_100');
    expect(deleted).toBe(true);
    expect(await repo.findById('usr_100')).toBeNull();
  });

  it('Product & Category Repositories', async () => {
    const categoryRepo = new CategoryRepository(engine);
    const productRepo = new ProductRepository(engine);

    const category = await categoryRepo.create({
      id: 'cat_electronics',
      name: 'Electronics',
      slug: 'electronics',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const product = await productRepo.create({
      id: 'prod_macbook',
      sku: 'MAC-M3-001',
      name: 'MacBook Pro M3',
      price: 1999.99,
      categoryId: category.id,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(await productRepo.findBySku('mac-m3-001')).not.toBeNull();
    expect(await productRepo.findByCategoryId('cat_electronics')).toHaveLength(1);
  });

  it('InventoryRepository stock operations & validation', async () => {
    const inventoryRepo = new InventoryRepository(engine);

    await inventoryRepo.setStock('prod_macbook', 10, 2);
    let item = await inventoryRepo.findByProductId('prod_macbook');
    expect(item?.stockQuantity).toBe(10);

    // Deduct 3 units -> 7
    item = await inventoryRepo.updateStock('prod_macbook', -3);
    expect(item?.stockQuantity).toBe(7);

    // Attempting to deduct 10 when stock is 7 must throw error
    await expect(inventoryRepo.updateStock('prod_macbook', -10)).rejects.toThrow('Insufficient inventory stock');
  });

  it('Order, Customer & Settings Repositories', async () => {
    const customerRepo = new CustomerRepository(engine);
    const orderRepo = new OrderRepository(engine);
    const settingsRepo = new SettingsRepository(engine);

    const customer = await customerRepo.create({
      id: 'cust_1',
      name: 'John Customer',
      email: 'john@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const order = await orderRepo.create({
      id: 'ord_1',
      orderNumber: 'ORD-10001',
      customerId: customer.id,
      items: [{ productId: 'prod_macbook', quantity: 1, unitPrice: 1999.99, total: 1999.99 }],
      subtotal: 1999.99,
      tax: 160.0,
      discount: 0,
      total: 2159.99,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(order.orderNumber).toBe('ORD-10001');

    const updatedOrder = await orderRepo.updateStatus('ord_1', 'completed');
    expect(updatedOrder?.status).toBe('completed');

    const settings = await settingsRepo.updateSettings({ storeName: 'NexoraPOS Flagship' });
    expect(settings.storeName).toBe('NexoraPOS Flagship');
  });
});
