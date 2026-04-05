export async function GET() {
  return {
    ok: true,
    service: "hacimertgokhan.com",
    timestamp: new Date().toISOString(),
  };
}
