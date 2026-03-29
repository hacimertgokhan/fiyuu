/**
 * Middleware runner for the Fiyuu runtime server.
 * Loads the app-level middleware.ts module and chains handlers.
 */

import { existsSync } from "node:fs";
import path from "node:path";
import type { IncomingMessage } from "node:http";
import type {
  MiddlewareContext,
  MiddlewareHandler,
  MiddlewareModule,
  MiddlewareResult,
  StartServerOptions,
} from "./server-types.js";
import { importModule } from "./server-loader.js";

export async function runMiddleware(
  options: StartServerOptions,
  url: URL,
  request: IncomingMessage,
  mode: "dev" | "start",
  stateWarnings: string[] = [],
  requestId = "",
): Promise<MiddlewareResult | undefined> {
  if (options.config?.middleware?.enabled === false) {
    return undefined;
  }

  const middlewarePath = path.join(options.appDirectory, "middleware.ts");
  if (!existsSync(middlewarePath)) {
    return undefined;
  }

  const module = (await importModule(middlewarePath, mode)) as MiddlewareModule;
  const handlers: MiddlewareHandler[] = Array.isArray(module.middleware)
    ? module.middleware
    : module.middleware
      ? [module.middleware]
      : [];

  const context: MiddlewareContext = {
    request,
    url,
    responseHeaders: {},
    requestId,
    warnings: stateWarnings,
  };
  let shortCircuit: MiddlewareResult["response"];
  let index = -1;

  async function dispatch(position: number): Promise<void> {
    if (position <= index) {
      throw new Error("Middleware next() called multiple times.");
    }
    index = position;
    const handler = handlers[position];
    if (!handler) return;

    const result = await handler(context, async () => dispatch(position + 1));
    if (result?.headers) {
      Object.assign(context.responseHeaders, result.headers);
    }
    if (result?.response) {
      shortCircuit = result.response;
    }
  }

  await dispatch(0);
  return { headers: context.responseHeaders, response: shortCircuit };
}
