/**
 * Simple metadata storage as a Reflect.metadata polyfill.
 * Uses WeakMap internally, no external dependency needed.
 */

const metadataStore = new WeakMap<object, Map<string | symbol, unknown>>();

function getOrCreateMap(target: object): Map<string | symbol, unknown> {
  let map = metadataStore.get(target);
  if (!map) {
    map = new Map();
    metadataStore.set(target, map);
  }
  return map;
}

function makeKey(key: string | symbol, propertyKey?: string | symbol): string | symbol {
  if (propertyKey !== undefined) {
    return `${String(key)}:${String(propertyKey)}`;
  }
  return key;
}

export function defineMetadata(metadataKey: string | symbol, value: unknown, target: object, propertyKey?: string | symbol): void {
  const map = getOrCreateMap(target);
  map.set(makeKey(metadataKey, propertyKey), value);
}

export function getOwnMetadata(metadataKey: string | symbol, target: object, propertyKey?: string | symbol): unknown {
  const map = metadataStore.get(target);
  if (!map) return undefined;
  return map.get(makeKey(metadataKey, propertyKey));
}

export function getMetadata(metadataKey: string | symbol, target: object, propertyKey?: string | symbol): unknown {
  return getOwnMetadata(metadataKey, target, propertyKey);
}

export function hasMetadata(metadataKey: string | symbol, target: object, propertyKey?: string | symbol): boolean {
  const map = metadataStore.get(target);
  if (!map) return false;
  return map.has(makeKey(metadataKey, propertyKey));
}
