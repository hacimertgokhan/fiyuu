import { Service } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";
import { hashPassword, verifyPassword, generateTokens } from "../lib/auth.js";
import { ConflictException, UnauthorizedException } from "@fiyuu/core";
import type { UserRepository } from "../repositories/user.repository.js";

@Service()
export class AuthService {
  constructor(private userRepo: UserRepository) {}
  
  async register(name: string, email: string, password: string) {
    // Check if email exists
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException("Email already registered");
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await db.table("users").insert({
      id: crypto.randomUUID(),
      email,
      password: hashedPassword,
      name,
      role: "user",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    // Generate tokens
    const tokens = generateTokens(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }
  
  async login(email: string, password: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }
    
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }
    
    const tokens = generateTokens(user.id, user.email);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }
  
  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    await db.table("users").update(
      { id: userId },
      { ...data, updatedAt: new Date().toISOString() }
    );
    
    return this.userRepo.findWithWorkspaces(userId);
  }
}
