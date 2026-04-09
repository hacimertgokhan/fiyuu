/**
 * Fiyuu Dependency Injection Container
 *
 * Simple, decorator-based DI container with constructor injection.
 * Supports singleton and transient scopes.
 *
 * @example
 * ```ts
 * @Injectable()
 * class UserService {
 *   constructor(private repo: UserRepository) {}
 * }
 *
 * const container = Container.getInstance();
 * const service = container.resolve(UserService);
 * ```
 */

import { defineMetadata, getOwnMetadata } from "./metadata.js";

export type Constructor<T = unknown> = new (...args: unknown[]) => T;

export type Scope = "singleton" | "transient";

interface Registration {
  target: Constructor;
  scope: Scope;
  instance?: unknown;
  dependencies: Constructor[];
}

const INJECTABLE_KEY = Symbol("fiyuu:injectable");
const INJECT_KEY = Symbol("fiyuu:inject");

export class Container {
  private static instance: Container;
  private registrations = new Map<Constructor, Registration>();
  private resolving = new Set<Constructor>();

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  static reset(): void {
    Container.instance = new Container();
  }

  register(target: Constructor, scope: Scope = "singleton", dependencies: Constructor[] = []): void {
    this.registrations.set(target, {
      target,
      scope,
      dependencies,
    });
  }

  resolve<T>(target: Constructor<T>): T {
    const registration = this.registrations.get(target);

    if (!registration) {
      // Auto-register if decorated with @Injectable
      const meta = getOwnMetadata(INJECTABLE_KEY, target) as { scope: Scope; dependencies: Constructor[] } | undefined;
      if (meta) {
        this.register(target, meta.scope, meta.dependencies);
        return this.resolve(target);
      }
      // Try to construct without registration (no-dep classes)
      return new target() as T;
    }

    // Return existing singleton
    if (registration.scope === "singleton" && registration.instance) {
      return registration.instance as T;
    }

    // Circular dependency check
    if (this.resolving.has(target)) {
      throw new Error(
        `Circular dependency detected: ${target.name} -> ${[...this.resolving].map((c) => c.name).join(" -> ")}`,
      );
    }

    this.resolving.add(target);

    try {
      // Resolve dependencies
      const deps = registration.dependencies.map((dep) => this.resolve(dep));
      const instance = new registration.target(...deps) as T;

      if (registration.scope === "singleton") {
        registration.instance = instance;
      }

      return instance;
    } finally {
      this.resolving.delete(target);
    }
  }

  has(target: Constructor): boolean {
    return this.registrations.has(target);
  }

  getAll(): Map<Constructor, Registration> {
    return new Map(this.registrations);
  }
}

// ── Decorators ────────────────────────────────────────────────────────────

/**
 * Marks a class as injectable in the DI container.
 */
export function Injectable(options: { scope?: Scope } = {}): ClassDecorator {
  return function (target: Function) {
    const scope = options.scope ?? "singleton";

    // Store metadata
    defineMetadata(INJECTABLE_KEY, { scope, dependencies: [] }, target);

    // Auto-register
    Container.getInstance().register(target as Constructor, scope, []);
  };
}

/**
 * Parameter decorator for explicit injection.
 */
export function Inject(token: Constructor): ParameterDecorator {
  return function (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existing = (getOwnMetadata(INJECT_KEY, target) as Array<{ index: number; token: Constructor }>) ?? [];
    existing.push({ index: parameterIndex, token });
    defineMetadata(INJECT_KEY, existing, target);
  };
}

// Re-export symbol keys for metadata access
export { INJECTABLE_KEY, INJECT_KEY };
