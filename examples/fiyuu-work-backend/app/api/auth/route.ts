import { db } from "@fiyuu/db";
import { AuthGuard } from "../../guards/auth.guard.js";
import { AuthService } from "../../services/auth.service.js";
import { UserRepository } from "../../repositories/user.repository.js";
import { generateTokens } from "../../lib/auth.js";
import { BadRequestException, UnauthorizedException } from "@fiyuu/core";

// Services
const userRepo = new UserRepository();
const authService = new AuthService(userRepo);

// POST /api/auth/register
export async function POST(request: Request) {
  const body = await request.json();
  const { action } = body;
  
  if (action === "register") {
    const { name, email, password } = body;
    
    if (!name || !email || !password) {
      throw new BadRequestException("Missing required fields");
    }
    
    const result = await authService.register(name, email, password);
    return Response.json(result, { status: 201 });
  }
  
  if (action === "login") {
    const { email, password } = body;
    
    if (!email || !password) {
      throw new BadRequestException("Email and password required");
    }
    
    const result = await authService.login(email, password);
    return Response.json(result);
  }
  
  throw new BadRequestException("Invalid action");
}

// GET /api/auth/me - Get current user
export async function GET(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const user = await userRepo.findWithWorkspaces(userId);
  
  if (!user) {
    throw new UnauthorizedException("User not found");
  }
  
  return Response.json({ user });
}

// PATCH /api/auth/me - Update profile
export async function PATCH(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const userId = (request as any).user.id;
  const body = await request.json();
  
  const user = await authService.updateProfile(userId, {
    name: body.name,
    avatar: body.avatar,
  });
  
  return Response.json({ user });
}
