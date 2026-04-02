import type { products } from './schema';

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
