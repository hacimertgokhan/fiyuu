# Decorators

Fiyuu provides Spring Boot-style decorators for enterprise patterns. Build scalable APIs with minimal boilerplate.

## Installation

```typescript
import { 
  Controller, Get, Post, Put, Delete, Patch,
  Param, Body, Query, Headers,
  Service, Repository, Injectable,
  Guard, UseGuard, Scheduled,
  ExceptionHandler
} from "@fiyuu/core/decorators";
```

## Controllers

Controllers handle HTTP requests. Define routes with method decorators.

### Basic Controller

```typescript
import { Controller, Get, Post, Body, Param } from "@fiyuu/core/decorators";

@Controller("/api/users")
class UserController {
  
  @Get("/")
  async list() {
    return { users: [] };
  }
  
  @Get("/:id")
  async getById(@Param("id") id: string) {
    return { id, name: "John" };
  }
  
  @Post("/")
  async create(@Body() data: CreateUserDTO) {
    return { id: crypto.randomUUID(), ...data };
  }
}
```

### Route Prefix

```typescript
@Controller("/api/v1/products")
class ProductController {
  // All routes prefixed with /api/v1/products
  
  @Get("/")        // GET /api/v1/products
  async list() {}
  
  @Get("/:id")     // GET /api/v1/products/123
  async get() {}
}
```

### HTTP Methods

```typescript
@Controller("/api/items")
class ItemController {
  @Get("/")           // Read all
  async list() {}
  
  @Get("/:id")        // Read one
  async get(@Param("id") id: string) {}
  
  @Post("/")          // Create
  async create(@Body() data: any) {}
  
  @Put("/:id")        // Full update
  async update(@Param("id") id: string, @Body() data: any) {}
  
  @Patch("/:id")      // Partial update
  async patch(@Param("id") id: string, @Body() data: any) {}
  
  @Delete("/:id")     // Delete
  async remove(@Param("id") id: string) {}
}
```

## Parameter Decorators

Extract data from requests:

### @Param

Route parameters:

```typescript
@Get("/users/:id/posts/:postId")
async getPost(
  @Param("id") userId: string,
  @Param("postId") postId: string
) {
  return { userId, postId };
}

// GET /users/123/posts/456
// → { userId: "123", postId: "456" }
```

### @Body

Request body:

```typescript
@Post("/users")
async create(@Body() data: CreateUserDTO) {
  // data is typed and validated
  return this.userService.create(data);
}
```

With validation:

```typescript
class CreateUserDTO {
  @IsString() @MinLength(2)
  name!: string;
  
  @IsEmail()
  email!: string;
  
  @IsOptional() @IsString()
  bio?: string;
}

@Post("/users")
async create(@Body() data: CreateUserDTO) {
  // Automatically validated
  return { success: true };
}
```

### @Query

Query parameters:

```typescript
@Get("/search")
async search(
  @Query("q") query: string,
  @Query("page") page: number = 1,
  @Query("limit") limit: number = 20
) {
  return { query, page, limit };
}

// GET /search?q=hello&page=2
// → { query: "hello", page: 2, limit: 20 }
```

### @Headers

Request headers:

```typescript
@Get("/profile")
async profile(@Headers("authorization") token: string) {
  return this.authService.verify(token);
}

// All headers
@Get("/debug")
async debug(@Headers() headers: Record<string, string>) {
  return { headers };
}
```

## Services

Business logic layer. Auto-injected into controllers.

### @Service

```typescript
import { Service } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Service()
class UserService {
  async findAll() {
    return db.query("SELECT * FROM users");
  }
  
  async findById(id: string) {
    const [user] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return user;
  }
  
  async create(data: CreateUserDTO) {
    const id = crypto.randomUUID();
    await db.query(
      "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
      [id, data.name, data.email]
    );
    return { id, ...data };
  }
}
```

### Dependency Injection

```typescript
@Controller("/api/users")
class UserController {
  // Auto-injected
  constructor(private userService: UserService) {}
  
  @Get("/")
  async list() {
    return this.userService.findAll();
  }
  
  @Get("/:id")
  async get(@Param("id") id: string) {
    return this.userService.findById(id);
  }
}
```

### Multiple Dependencies

```typescript
@Controller("/api/orders")
class OrderController {
  constructor(
    private orderService: OrderService,
    private userService: UserService,
    private emailService: EmailService
  ) {}
  
  @Post("/")
  async create(@Body() data: CreateOrderDTO) {
    const user = await this.userService.findById(data.userId);
    const order = await this.orderService.create(data);
    await this.emailService.sendOrderConfirmation(user.email, order);
    return order;
  }
}
```

## Repositories

Data access layer with automatic CRUD.

### @Repository

```typescript
import { Repository } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Repository("users")  // Table name
class UserRepository {
  // Auto-generated: findAll, findById, create, update, delete
  
  // Custom queries
  async findByEmail(email: string) {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return user;
  }
  
  async search(query: string) {
    return db.query(
      "SELECT * FROM users WHERE name LIKE ? OR email LIKE ?",
      [`%${query}%`, `%${query}%`]
    );
  }
}
```

### Using Repository

```typescript
@Service()
class UserService {
  constructor(private userRepo: UserRepository) {}
  
  async findByEmail(email: string) {
    return this.userRepo.findByEmail(email);
  }
  
  async search(query: string) {
    return this.userRepo.search(query);
  }
}
```

## Guards

Protect routes with authorization.

### @Guard

```typescript
import { Guard, CanActivate } from "@fiyuu/core/decorators";

@Guard()
class AuthGuard implements CanActivate {
  async canActivate(request: Request): Promise<boolean> {
    const token = request.headers.get("authorization");
    if (!token) return false;
    
    try {
      const user = await verifyJWT(token);
      (request as any).user = user;
      return true;
    } catch {
      return false;
    }
  }
}
```

### @UseGuard

Apply guard to controller or method:

```typescript
@Controller("/api/admin")
@UseGuard(AuthGuard)  // Applies to all routes
class AdminController {
  
  @Get("/stats")
  async stats() {
    return { revenue: 100000 };
  }
}

@Controller("/api/users")
class UserController {
  
  @Get("/public")
  async publicProfile() {
    // No guard - public
    return { message: "Hello" };
  }
  
  @Get("/profile")
  @UseGuard(AuthGuard)  // Only this route protected
  async privateProfile(@Req() req: Request) {
    return req.user;
  }
}
```

### Role-Based Guards

```typescript
@Guard()
class RolesGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}
  
  async canActivate(request: Request): Promise<boolean> {
    const user = (request as any).user;
    return this.allowedRoles.includes(user.role);
  }
}

@Controller("/api/admin")
@UseGuard(AuthGuard, new RolesGuard(["admin", "moderator"]))
class AdminController {}
```

## Scheduled Tasks

Run background jobs with cron syntax.

### @Scheduled

```typescript
import { Scheduled } from "@fiyuu/core/decorators";
import { db } from "@fiyuu/db";

@Service()
class CleanupService {
  
  // Every minute
  @Scheduled("* * * * *")
  async cleanupExpiredSessions() {
    await db.query("DELETE FROM sessions WHERE expires_at < NOW()");
    console.log("Cleaned up expired sessions");
  }
  
  // Every hour
  @Scheduled("0 * * * *")
  async generateReports() {
    const stats = await this.calculateStats();
    await this.saveReport(stats);
  }
  
  // Daily at midnight
  @Scheduled("0 0 * * *")
  async dailyBackup() {
    await this.backupDatabase();
  }
  
  // Every 30 seconds
  @Scheduled("*/30 * * * * *")
  async healthCheck() {
    await this.checkServices();
  }
}
```

### Cron Syntax

```
* * * * * *
│ │ │ │ │ │
│ │ │ │ │ └─── Second (0-59) [optional]
│ │ │ │ └───── Minute (0-59)
│ │ │ └─────── Hour (0-23)
│ │ └───────── Day of month (1-31)
│ └─────────── Month (1-12)
└───────────── Day of week (0-7, 0 and 7 = Sunday)
```

Common patterns:
- `"*/5 * * * *"` - Every 5 minutes
- `"0 */6 * * *"` - Every 6 hours
- `"0 9 * * 1"` - Every Monday at 9 AM
- `"0 0 1 * *"` - First day of month

## Exception Handling

### @ExceptionHandler

```typescript
import { ExceptionHandler } from "@fiyuu/core/decorators";

@ExceptionHandler()
class GlobalExceptionFilter {
  catch(error: Error, request: Request) {
    console.error(`Error in ${request.url}:`, error);
    
    if (error instanceof ValidationError) {
      return Response.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    
    if (error instanceof NotFoundError) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## DTO Validation

### Validation Decorators

```typescript
import { 
  IsString, IsEmail, IsNumber, IsBoolean, IsOptional,
  MinLength, MaxLength, Min, Max,
  validateDTO 
} from "@fiyuu/core/decorators";

class CreateUserDTO {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;
  
  @IsEmail()
  email!: string;
  
  @IsOptional()
  @IsString()
  @MinLength(10)
  bio?: string;
  
  @IsOptional()
  @IsNumber()
  @Min(13)
  @Max(120)
  age?: number;
  
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean = false;
}

// Usage
@Post("/users")
async create(@Body() data: CreateUserDTO) {
  // Already validated
  return this.userService.create(data);
}
```

### Manual Validation

```typescript
const data = { name: "Jo", email: "invalid" };
const result = validateDTO(CreateUserDTO, data);

if (!result.valid) {
  console.log(result.errors);
  // [{ field: "name", message: "Min length is 2" },
  //  { field: "email", message: "Invalid email" }]
}
```

## Complete Example

```typescript
// dto/user.dto.ts
class CreateUserDTO {
  @IsString() @MinLength(2) name!: string;
  @IsEmail() email!: string;
}

// repository/user.repository.ts
@Repository("users")
class UserRepository {
  async findByEmail(email: string) {
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return user;
  }
}

// service/user.service.ts
@Service()
class UserService {
  constructor(private repo: UserRepository) {}
  
  async create(data: CreateUserDTO) {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) throw new Error("Email already exists");
    
    return this.repo.create({ ...data, id: crypto.randomUUID() });
  }
}

// guard/auth.guard.ts
@Guard()
class AuthGuard implements CanActivate {
  async canActivate(request: Request) {
    const token = request.headers.get("authorization");
    return !!token && verifyJWT(token);
  }
}

// controller/user.controller.ts
@Controller("/api/users")
@UseGuard(AuthGuard)
class UserController {
  constructor(private userService: UserService) {}
  
  @Get("/")
  async list() {
    return this.userService.findAll();
  }
  
  @Get("/:id")
  async get(@Param("id") id: string) {
    return this.userService.findById(id);
  }
  
  @Post("/")
  async create(@Body() data: CreateUserDTO) {
    return this.userService.create(data);
  }
  
  @Put("/:id")
  async update(@Param("id") id: string, @Body() data: UpdateUserDTO) {
    return this.userService.update(id, data);
  }
  
  @Delete("/:id")
  async remove(@Param("id") id: string) {
    return this.userService.delete(id);
  }
}
```

## Best Practices

1. **Thin controllers, fat services** - Keep logic in services
2. **One controller per resource** - `UserController`, `OrderController`
3. **Use DTOs** - Always validate input
4. **Repository pattern** - Abstract data access
5. **Guards for auth** - Centralize authorization
6. **Handle exceptions** - Use exception filters

## Next Steps

- Learn about [Database](./database.md) operations
- Explore [Real-Time](./realtime.md) channels
- Read the [HTTP Exceptions](./http-exceptions.md) guide
