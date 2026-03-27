import type { WebSocket } from "ws";

export function registerSocketServer() {
  return {
    namespace: "updates",
    events: ["counter:tick", "socket:echo"],
    onConnect(socket: WebSocket) {
      socket.send(JSON.stringify({ type: "socket:connected", channel: "updates" }));
      let count = 0;
      const interval = setInterval(() => {
        count += 1;
        socket.send(JSON.stringify({ type: "counter:tick", count }));
      }, 1000);

      socket.on("close", () => {
        clearInterval(interval);
      });
    },
    onMessage(socket: WebSocket, message: string) {
      socket.send(JSON.stringify({ type: "socket:echo", message }));
    },
  };
}
