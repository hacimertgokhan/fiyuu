import { createFlatStore } from "./pure-framework.js";

type InventoryFlatState = {
  locale: string;
  currency: string;
  defaultUnit: string;
  lowStockThresholdLabel: string;
};

export const inventoryFlatStore = createFlatStore<InventoryFlatState>({
  locale: "tr-TR",
  currency: "TRY",
  defaultUnit: "adet",
  lowStockThresholdLabel: "minimum seviye",
});

export function formatMoney(value: number): string {
  const state = inventoryFlatStore.get();
  return new Intl.NumberFormat(state.locale, {
    style: "currency",
    currency: state.currency,
  }).format(value);
}

export function defaultUnit(): string {
  return inventoryFlatStore.get().defaultUnit;
}
