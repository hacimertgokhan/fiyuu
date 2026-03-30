import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    stats: z.object({
      totalProducts: z.number(),
      totalValue: z.number(),
      lowStockCount: z.number(),
      outOfStockCount: z.number(),
    }),
    recentMovements: z.array(z.object({
      id: z.string(),
      productName: z.string(),
      type: z.string(),
      quantity: z.number(),
      date: z.number(),
    })),
    lowStockProducts: z.array(z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string(),
      quantity: z.number(),
      minStock: z.number(),
      category: z.string(),
    })),
  }),
  description: "Dashboard query - stats, recent movements, low stock alerts",
});

export async function execute() {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  // Seed sample data if empty
  const productsTable = db.table("products");
  if (productsTable.count === 0) {
    await db.seed("products", [
      { name: "MacBook Pro 16\"", sku: "MBP-16-001", category: "Electronics", price: 49999, quantity: 12, minStock: 5, unit: "adet" },
      { name: "iPhone 15 Pro", sku: "IPH-15P-001", category: "Electronics", price: 32999, quantity: 3, minStock: 10, unit: "adet" },
      { name: "AirPods Pro", sku: "APP-001", category: "Accessories", price: 7999, quantity: 28, minStock: 15, unit: "adet" },
      { name: "USB-C Cable 2m", sku: "USB-C-2M", category: "Accessories", price: 149, quantity: 150, minStock: 50, unit: "adet" },
      { name: "iPad Air", sku: "IPA-001", category: "Electronics", price: 21999, quantity: 0, minStock: 5, unit: "adet" },
      { name: "Magic Keyboard", sku: "MKB-001", category: "Accessories", price: 4499, quantity: 8, minStock: 5, unit: "adet" },
      { name: "Studio Display", sku: "STD-001", category: "Electronics", price: 79999, quantity: 2, minStock: 3, unit: "adet" },
      { name: "Apple Pencil", sku: "APL-001", category: "Accessories", price: 3999, quantity: 22, minStock: 10, unit: "adet" },
    ]);
  }

  const movementsTable = db.table("stock_movements");
  if (movementsTable.count === 0) {
    await db.seed("stock_movements", [
      { productName: "MacBook Pro 16\"", type: "in", quantity: 5, reason: "Satın alma", date: Date.now() - 86400000 * 2 },
      { productName: "iPhone 15 Pro", type: "out", quantity: 7, reason: "Satış", date: Date.now() - 86400000 },
      { productName: "AirPods Pro", type: "in", quantity: 20, reason: "Stok yenileme", date: Date.now() - 3600000 * 5 },
      { productName: "USB-C Cable 2m", type: "out", quantity: 30, reason: "Toplu satış", date: Date.now() - 3600000 * 2 },
      { productName: "iPad Air", type: "out", quantity: 5, reason: "Satış", date: Date.now() - 3600000 },
    ]);
  }

  // Calculate stats
  const products = productsTable.find({}) as unknown as Array<{
    name: string; price: number; quantity: number; minStock: number;
  }>;

  const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const lowStockCount = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  // Recent movements
  const movements = movementsTable.find({}) as unknown as Array<{
    id: string; productName: string; type: string; quantity: number; date: number;
  }>;
  const recentMovements = movements.sort((a, b) => b.date - a.date).slice(0, 5);

  // Low stock products
  const lowStockProducts = products
    .filter((p) => p.quantity <= p.minStock)
    .map((p) => ({
      id: (p as any)._id || "",
      name: p.name,
      sku: (p as any).sku || "",
      quantity: p.quantity,
      minStock: p.minStock,
      category: (p as any).category || "",
    }));

  return {
    stats: {
      totalProducts: products.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
    },
    recentMovements: recentMovements.map((m) => ({
      id: m.id || "",
      productName: m.productName,
      type: m.type,
      quantity: m.quantity,
      date: m.date,
    })),
    lowStockProducts,
  };
}
