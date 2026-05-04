/**
 * actState — Fiyuu'nun reaktif state primitive'i.
 *
 * React'ın useState'ine benzer ama render-bağımsız, sabit obje döner.
 * Closure gerektirmez, functional update + reset + derived destekler.
 *
 * @example
 * const locale = actState("tr");
 * locale.get()               // "tr"
 * locale.set("en")           // güncelle
 * locale.update(v => v === "tr" ? "en" : "tr")  // fonksiyonel güncelle
 * locale.reset()             // "tr"'ye dön
 *
 * const upper = locale.derived(v => v.toUpperCase());
 * upper.get()                // "EN"
 */

export type ActStateListener<T> = (next: T, prev: T) => void;

export type DerivedState<T> = {
  readonly get: () => T;
  readonly subscribe: (fn: ActStateListener<T>) => () => void;
};

export type ActState<T> = {
  /** Anlık değeri döner. */
  readonly get: () => T;

  /** Değeri doğrudan atar. Aynı referans ise güncelleme tetiklenmez. */
  readonly set: (next: T) => void;

  /**
   * Mevcut değerden yeni değer türetir.
   * @example count.update(n => n + 1)
   */
  readonly update: (fn: (current: T) => T) => void;

  /** Initial value'ya döner. */
  readonly reset: () => void;

  /**
   * Değer değiştiğinde çağrılır.
   * Unsubscribe fonksiyonu döner.
   */
  readonly subscribe: (fn: ActStateListener<T>) => () => void;

  /**
   * Bu state'ten türetilmiş salt-okunur bir state üretir.
   * Ana state her değiştiğinde otomatik hesaplanır.
   *
   * @example
   * const count = actState(0);
   * const doubled = count.derived(n => n * 2);
   * doubled.get(); // 0
   * count.set(3);
   * doubled.get(); // 6
   */
  readonly derived: <U>(fn: (value: T) => U) => DerivedState<U>;

  /**
   * Başka bir actState ile senkronize eder.
   * Bu state değiştiğinde target de güncellenir.
   * Unsubscribe fonksiyonu döner.
   */
  readonly pipe: <U>(target: ActState<U>, transform: (value: T) => U) => () => void;
};

function createDerived<T, U>(source: ActState<T>, fn: (value: T) => U): DerivedState<U> {
  let cached = fn(source.get());
  const listeners = new Set<ActStateListener<U>>();

  source.subscribe((next) => {
    const prev = cached;
    const computed = fn(next);
    if (computed === prev) return;
    cached = computed;
    listeners.forEach((listener) => listener(computed, prev));
  });

  return {
    get() {
      return cached;
    },
    subscribe(fn: ActStateListener<U>) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function actState<T>(initial: T): ActState<T> {
  let value = initial;
  const listeners = new Set<ActStateListener<T>>();

  function notify(next: T, prev: T): void {
    listeners.forEach((fn) => fn(next, prev));
  }

  const state: ActState<T> = {
    get() {
      return value;
    },

    set(next: T) {
      if (Object.is(value, next)) return;
      const prev = value;
      value = next;
      notify(next, prev);
    },

    update(fn: (current: T) => T) {
      state.set(fn(value));
    },

    reset() {
      state.set(initial);
    },

    subscribe(fn: ActStateListener<T>) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    derived<U>(fn: (value: T) => U): DerivedState<U> {
      return createDerived(state, fn);
    },

    pipe<U>(target: ActState<U>, transform: (value: T) => U) {
      return state.subscribe((next) => target.set(transform(next)));
    },
  };

  return state;
}

/**
 * Birden fazla actState'i tek bir derived state'te birleştirir.
 *
 * @example
 * const a = actState(2);
 * const b = actState(3);
 * const sum = combineState([a, b], ([x, y]) => x + y);
 * sum.get(); // 5
 */
export function combineState<T extends readonly ActState<unknown>[], U>(
  states: T,
  fn: (values: { [K in keyof T]: T[K] extends ActState<infer V> ? V : never }) => U,
): DerivedState<U> {
  type Values = { [K in keyof T]: T[K] extends ActState<infer V> ? V : never };

  function getValues(): Values {
    return states.map((s) => s.get()) as unknown as Values;
  }

  let cached = fn(getValues());
  const listeners = new Set<ActStateListener<U>>();

  for (const s of states) {
    s.subscribe(() => {
      const prev = cached;
      const next = fn(getValues());
      if (Object.is(next, prev)) return;
      cached = next;
      listeners.forEach((listener) => listener(next, prev));
    });
  }

  return {
    get() {
      return cached;
    },
    subscribe(fn: ActStateListener<U>) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/**
 * Bir actState'i DOM element'iyle bağlar.
 * State değiştiğinde element otomatik güncellenir.
 *
 * @example
 * const count = actState(0);
 * bindState(count, "#counter", v => `Sayı: ${v}`);
 */
export function bindState<T>(
  state: ActState<T> | DerivedState<T>,
  selector: string | Element,
  render: (value: T) => string,
): () => void {
  const el = typeof selector === "string" ? document.querySelector(selector) : selector;
  if (!el) return () => {};

  el.innerHTML = render(state.get());

  return state.subscribe((next) => {
    el.innerHTML = render(next);
  });
}
