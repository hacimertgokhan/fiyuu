import { defineService } from "@fiyuu/runtime";

/**
 * Low Stock Alert Service
 * Periodically checks stock levels and broadcasts alerts.
 */
export default defineService({
  name: "stock-alerts",

  async start({ realtime, db, log }) {
    const alerts = realtime.channel("inventory-alerts");

    const checkStock = async () => {
      const products = db.table("products").find({}) as unknown as Array<{
        _id: string; name: string; sku: string; quantity: number; minStock: number;
      }>;

      const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
      const outOfStock = products.filter((p) => p.quantity === 0);

      if (lowStock.length > 0) {
        alerts.broadcast("low-stock", {
          type: "warning",
          message: `${lowStock.length} ürün düşük stok seviyesinde`,
          products: lowStock.map((p) => ({ name: p.name, quantity: p.quantity, minStock: p.minStock })),
          ts: Date.now(),
        });
      }

      if (outOfStock.length > 0) {
        alerts.broadcast("out-of-stock", {
          type: "critical",
          message: `${outOfStock.length} ürün stokta yok`,
          products: outOfStock.map((p) => ({ name: p.name })),
          ts: Date.now(),
        });
      }

      log("info", "stock-check", { lowStock: lowStock.length, outOfStock: outOfStock.length });
    };

    // Initial check
    await checkStock();

    // Check every 5 minutes
    setInterval(checkStock, 5 * 60 * 1000);

    log("info", "stock-alert-service-ready");
  },

  async stop({ log }) {
    log("info", "stock-alert-service-stopped");
  },
});
