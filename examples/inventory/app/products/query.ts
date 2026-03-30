import { z } from "zod";
import { defineQuery } from "@fiyuu/core/client";

export const query = defineQuery({
  input: z.object({}),
  output: z.object({
    products: z.array(z.object({
      id: z.string(),
      name: z.string(),
      sku: z.string(),
      category: z.string(),
      price: z.number(),
      quantity: z.number(),
      minStock: z.number(),
      unit: z.string(),
    })),
    categories: z.array(z.string()),
  }),
  description: "Products listing query",
});

export async function execute() {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const products = db.table("products").find({}) as unknown as Array<{
    _id: string; name: string; sku: string; category: string;
    price: number; quantity: number; minStock: number; unit: string;
  }>;

  const categories = [...new Set(products.map((p) => p.category))].sort();

  return {
    products: products.map((p) => ({
      id: p._id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      quantity: p.quantity,
      minStock: p.minStock,
      unit: p.unit,
    })),
    categories,
  };
}
