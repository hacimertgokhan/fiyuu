export async function GET() {
  return {
    ok: true,
    service: "hacimertgokhan.me",
    timestamp: new Date().toISOString(),
  };
}
