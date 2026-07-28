import { z } from 'zod';

export const UserRoleSchema = z.enum(['admin', 'manager', 'cashier', 'customer']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  passwordHash: z.string().min(1),
  name: z.string().min(1),
  role: UserRoleSchema,
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const SessionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  token: z.string().min(1),
  expiresAt: z.string(),
  createdAt: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

export const ProductSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().nonnegative(),
  categoryId: z.string().min(1),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Product = z.infer<typeof ProductSchema>;

export const InventoryItemSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  stockQuantity: z.number().int(),
  reorderPoint: z.number().int().nonnegative().default(5),
  lastAdjustedAt: z.string(),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const OrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
  total: z.number().nonnegative(),
});
export type OrderItem = z.infer<typeof OrderItemSchema>;

export const OrderStatusSchema = z.enum(['pending', 'completed', 'cancelled']);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const OrderSchema = z.object({
  id: z.string().min(1),
  orderNumber: z.string().min(1),
  customerId: z.string().optional(),
  items: z.array(OrderItemSchema),
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative().default(0),
  total: z.number().nonnegative(),
  status: OrderStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof OrderSchema>;

export const CustomerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Customer = z.infer<typeof CustomerSchema>;

export const SettingsSchema = z.object({
  storeName: z.string().default('NexoraPOS Store'),
  currency: z.string().default('USD'),
  taxRate: z.number().nonnegative().default(0.08),
  receiptFooter: z.string().default('Thank you for shopping with NexoraPOS!'),
  updatedAt: z.string(),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DatabaseSchema = z.object({
  version: z.number().int().positive().default(1),
  users: z.array(UserSchema).default([]),
  sessions: z.array(SessionSchema).default([]),
  products: z.array(ProductSchema).default([]),
  categories: z.array(CategorySchema).default([]),
  inventory: z.array(InventoryItemSchema).default([]),
  orders: z.array(OrderSchema).default([]),
  customers: z.array(CustomerSchema).default([]),
  settings: SettingsSchema,
});
export type DatabaseState = z.infer<typeof DatabaseSchema>;

/**
 * Generates an initial default empty database state.
 */
export function createEmptyDatabase(): DatabaseState {
  const now = new Date().toISOString();
  return {
    version: 1,
    users: [],
    sessions: [],
    products: [],
    categories: [],
    inventory: [],
    orders: [],
    customers: [],
    settings: {
      storeName: 'NexoraPOS Store',
      currency: 'USD',
      taxRate: 0.08,
      receiptFooter: 'Thank you for shopping with NexoraPOS!',
      updatedAt: now,
    },
  };
}

/**
 * Validates database state object using DatabaseSchema.
 * Throws ValidationError if invalid.
 */
export function validateDatabaseState(data: unknown): DatabaseState {
  const result = DatabaseSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Database schema validation failed: ${result.error.message}`);
  }
  return result.data;
}
