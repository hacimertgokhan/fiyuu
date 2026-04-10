import bcrypt from "bcrypt";
import { db } from "@fiyuu/db";

const JWT_SECRET = process.env.JWT_SECRET || "fiyuu-work-secret-change-in-production";
const JWT_EXPIRES_IN = 15 * 60; // 15 minutes
const REFRESH_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days

// Simple JWT implementation (use a library in production)
export function generateTokens(userId: string, email: string) {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  
  const now = Math.floor(Date.now() / 1000);
  const accessPayload = btoa(JSON.stringify({
    sub: userId,
    email,
    iat: now,
    exp: now + JWT_EXPIRES_IN,
    type: "access",
  }));
  
  const refreshPayload = btoa(JSON.stringify({
    sub: userId,
    iat: now,
    exp: now + REFRESH_EXPIRES_IN,
    type: "refresh",
  }));
  
  const accessToken = `${header}.${accessPayload}.${createSignature(header, accessPayload)}`;
  const refreshToken = `${header}.${refreshPayload}.${createSignature(header, refreshPayload)}`;
  
  return { accessToken, refreshToken };
}

function createSignature(header: string, payload: string): string {
  // Simple signature - use proper HMAC in production
  return btoa(`${header}.${payload}.${JWT_SECRET}`).slice(0, 43);
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    const [header, payload, signature] = token.split(".");
    if (!header || !payload || !signature) return null;
    
    // Verify signature
    if (signature !== createSignature(header, payload)) return null;
    
    const data = JSON.parse(atob(payload));
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    
    return { userId: data.sub, email: data.email };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getCurrentUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) return null;
  
  const user = await db.table("users").findOne({ id: payload.userId });
  return user;
}
