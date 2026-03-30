import { z } from "zod";
import { defineAction } from "@fiyuu/core/client";

export const action = defineAction({
  input: z.object({
    action: z.enum(["add", "update"]),
    id: z.string().optional(),
    name: z.string().optional(),
    sku: z.string().optional(),
    category: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().optional(),
    minStock: z.number().optional(),
    unit: z.string().optional(),
  }),
  output: z.object({ success: z.boolean(), message: z.string() }),
  description: "Product CRUD actions",
});

export async function execute(input: Record<string, unknown>) {
  const { getDB } = await import("@fiyuu/db");
  const db = getDB();
  await db.initialize();

  const { action: act, id, ...data } = input as {
    action: "add" | "update";
    id?: string;
    name?: string;
    sku?: string;
    category?: string;
    price?: number;
    quantity?: number;
    minStock?: number;
    unit?: string;
  };

  const productsTable = db.table("products");

  if (act === "add") {
    productsTable.insert({
      name: data.name || "New Product",
      sku: data.sku || `SKU-${Date.now()}`,
      category: data.category || "General",
      price: data.price || 0,
      quantity: data.quantity || 0,
      minStock: data.minStock || 5,
      unit: data.unit || "adet",
    });
    return { success: true, message: "Ürün eklendi!" };
  }

  if (act === "update" && id) {
    productsTable.update(id, {
      name: data.name,
      sku: data.sku,
      category: data.category,
      price: data.price,
      quantity: data.quantity,
      minStock: data.minStock,
      unit: data.unit,
    });
    return { success: true, message: "Ürün güncellendi!" };
  }

  return { success: false, message: "Geçersiz işlem" };
}
