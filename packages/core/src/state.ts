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

export type FiyuuStore<T> = ReturnType<typeof createFiyuuStore<T>>;
