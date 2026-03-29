/**
 * WebSocket server attachment for the Fiyuu runtime.
 * Wires up a ws.WebSocketServer on the HTTP server's upgrade event.
 */

import { existsSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { WebSocketServer } from "ws";
import type { SocketModule, StartServerOptions } from "./server-types.js";
import { importModule } from "./server-loader.js";

export async function attachWebsocketServer(
  server: ReturnType<typeof createServer>,
  options: StartServerOptions,
  websocketPath: string,
): Promise<string | undefined> {
  if (!options.config?.websocket?.enabled) {
    return undefined;
  }

  const socketModulePath = path.join(options.rootDirectory, "server", "socket.ts");
  const socketModule = existsSync(socketModulePath)
    ? ((await importModule(socketModulePath, options.mode)) as SocketModule)
    : null;
  const registration = socketModule?.registerSocketServer?.() ?? {};

  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: options.config?.websocket?.maxPayloadBytes ?? 64 * 1024,
  });

  wss.on("connection", (socket) => {
    socket.send(
      JSON.stringify({
        type: "fiyuu:ready",
        namespace: registration.namespace ?? "app",
        events: registration.events ?? [],
      }),
    );
    registration.onConnect?.(socket);
    socket.on("message", (message) => {
      registration.onMessage?.(socket, message.toString());
    });
  });

  server.on("upgrade", (request, socket, head) => {
    if (!request.url) {
      socket.destroy();
      return;
    }
    const url = new URL(request.url, "http://localhost");
    if (url.pathname !== websocketPath) {
      socket.destroy();
      return;
    }
    wss.handleUpgrade(request, socket, head, (client) => {
      wss.emit("connection", client, request);
    });
  });

  return `ws://localhost:${options.port ?? 4050}${websocketPath}`;
}
