import { Guard, CanActivate } from "@fiyuu/core/decorators";
import { UnauthorizedException } from "@fiyuu/core";
import { verifyToken } from "../lib/auth.js";
import { db } from "@fiyuu/db";

@Guard()
export class AuthGuard implements CanActivate {
  async canActivate(request: Request): Promise<boolean> {
    const authHeader = request.headers.get("authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("No token provided");
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new UnauthorizedException("Invalid or expired token");
    }
    
    // Verify user still exists
    const user = await db.table("users").findOne({ id: payload.userId });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    
    // Attach user to request
    (request as any).user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    return true;
  }
}

@Guard()
export class AdminGuard implements CanActivate {
  async canActivate(request: Request): Promise<boolean> {
    const user = (request as any).user;
    
    if (!user) {
      throw new UnauthorizedException("Authentication required");
    }
    
    if (user.role !== "admin") {
      throw new UnauthorizedException("Admin access required");
    }
    
    return true;
  }
}
