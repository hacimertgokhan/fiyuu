# Authentication Guide

Implement JWT-based authentication with guards and protected routes.

## Overview

- JWT tokens for stateless auth
- Password hashing with bcrypt
- @Guard for route protection
- Refresh token rotation

## Setup

Install dependencies:
```bash
npm install bcrypt
npm install -D @types/bcrypt
```

## JWT Utilities

```typescript
// app/lib/auth.ts
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId, type: "refresh" }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { userId: string };
}
```

## Auth Guard

```typescript
// app/guards/auth.guard.ts
import { Guard, CanActivate } from "@fiyuu/core/decorators";
import { UnauthorizedException } from "@fiyuu/core";
import { verifyToken } from "../lib/auth.js";

@Guard()
export class AuthGuard implements CanActivate {
  async canActivate(request: Request): Promise<boolean> {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }
    
    const token = authHeader.slice(7);
    
    try {
      const payload = verifyToken(token);
      (request as any).user = { id: payload.userId };
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}
```

## Auth Controller

```typescript
// app/api/auth/route.ts
import { db } from "@fiyuu/db";
import { hashPassword, verifyPassword, generateTokens } from "../../lib/auth.js";
import { BadRequestException, UnauthorizedException } from "@fiyuu/core";

export async function POST(request: Request) {
  const { action, email, password } = await request.json();
  
  if (action === "register") {
    const existing = await db.table("users").findOne({ email });
    if (existing) {
      throw new BadRequestException("Email already exists");
    }
    
    const hashedPassword = await hashPassword(password);
    const user = await db.table("users").insert({
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
    });
    
    const tokens = generateTokens(user.id);
    return Response.json({ user: { id: user.id, email }, ...tokens });
  }
  
  if (action === "login") {
    const user = await db.table("users").findOne({ email });
    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException("Invalid credentials");
    }
    
    const tokens = generateTokens(user.id);
    return Response.json({ user: { id: user.id, email }, ...tokens });
  }
  
  throw new BadRequestException("Invalid action");
}
```

## Protected Routes

```typescript
// app/api/profile/route.ts
import { AuthGuard } from "../../guards/auth.guard.js";
import { db } from "@fiyuu/db";

export async function GET(request: Request) {
  // Apply guard
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const user = await db.table("users").findOne({ id: userId });
  
  return Response.json({ id: user.id, email: user.email });
}
```

## Role-Based Access

```typescript
// app/guards/roles.guard.ts
import { Guard, CanActivate } from "@fiyuu/core/decorators";
import { ForbiddenException } from "@fiyuu/core";

@Guard()
export class RolesGuard implements CanActivate {
  constructor(private roles: string[]) {}
  
  async canActivate(request: Request): Promise<boolean> {
    const user = (request as any).user;
    
    if (!this.roles.includes(user.role)) {
      throw new ForbiddenException(`Required roles: ${this.roles.join(", ")}`);
    }
    
    return true;
  }
}

// Usage with @Controller
@Controller("/api/admin")
@UseGuard(AuthGuard, new RolesGuard(["admin"]))
class AdminController {}
```

## Complete Example

See [examples/saas-dashboard.md](../examples/saas-dashboard.md) for full auth implementation.
