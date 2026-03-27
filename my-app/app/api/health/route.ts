export async function GET() {
  return {
    ok: true,
    service: "fiyuu-app",
    timestamp: new Date().toISOString(),
  };
}
