import { listSessions } from "../../../../server/f1/index.js";
export async function GET() {
  return { sessions: await listSessions() };
}
