import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";

export function useClientState<T>(initialValue: T) {
  const storeRef = useRef<ReturnType<typeof createFiyuuStore<T>> | null>(null);
  if (!storeRef.current) {
    storeRef.current = createFiyuuStore(initialValue);
  }
  const value = useSyncExternalStore(storeRef.current.subscribe, storeRef.current.get, storeRef.current.get);
  return [value, storeRef.current.set] as const;
}

export function useClientEffect(effect: Parameters<typeof useEffect>[0], deps?: Parameters<typeof useEffect>[1]) {
  return useEffect(effect, deps);
}

export function useClientMemo<T>(factory: () => T, deps: Parameters<typeof useMemo>[1]) {
  return useMemo(factory, deps);
}

export function createFiyuuStore<T>(initialValue: T) {
  let value = initialValue;
  const listeners = new Set<() => void>();

  return {
    get() {
      return value;
    },
    set(nextValue: T) {
      value = nextValue;
      for (const listener of listeners) {
        listener();
      }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export function useFiyuuStore<T>(store: { get: () => T; subscribe: (listener: () => void) => () => void }) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}
