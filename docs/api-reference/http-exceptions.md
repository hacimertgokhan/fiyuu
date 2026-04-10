# HTTP Exceptions

Structured error handling with HTTP status codes. Built-in exceptions for common error scenarios.

## Overview

Fiyuu provides HTTP exceptions that:
- Set appropriate HTTP status codes
- Return structured error responses
- Support error details and metadata
- Integrate with exception handlers

## Built-in Exceptions

### BadRequestException (400)

Invalid request data, validation errors.

```typescript
import { BadRequestException } from "@fiyuu/core";

// Simple message
throw new BadRequestException("Invalid email format");

// With details
throw new BadRequestException("Validation failed", {
  errors: [
    { field: "email", message: "Invalid format" },
    { field: "age", message: "Must be positive" },
  ],
});

// Response: 400 Bad Request
// {
//   "error": "Bad Request",
//   "message": "Validation failed",
//   "details": { "errors": [...] }
// }
```

### UnauthorizedException (401)

Authentication required or failed.

```typescript
import { UnauthorizedException } from "@fiyuu/core";

// Simple
throw new UnauthorizedException();

// With message
throw new UnauthorizedException("Invalid credentials");

// With authentication hint
throw new UnauthorizedException("Token expired", {
  hint: "Please login again",
});
```

### ForbiddenException (403)

Authenticated but not authorized.

```typescript
import { ForbiddenException } from "@fiyuu/core";

// Simple
throw new ForbiddenException();

// With reason
throw new ForbiddenException("Admin access required");

// With required permissions
throw new ForbiddenException("Insufficient permissions", {
  required: ["admin", "moderator"],
  current: "user",
});
```

### NotFoundException (404)

Resource not found.

```typescript
import { NotFoundException } from "@fiyuu/core";

// Simple
throw new NotFoundException();

// With resource type
throw new NotFoundException("User not found");

// With identifier
throw new NotFoundException("User not found", {
  resource: "user",
  id: "123",
});
```

### ConflictException (409)

Resource conflict, duplicate data.

```typescript
import { ConflictException } from "@fiyuu/core";

// Duplicate email
throw new ConflictException("Email already exists", {
  field: "email",
  value: "john@example.com",
});

// Duplicate username
throw new ConflictException("Username taken", {
  field: "username",
  suggestion: "john123",
});
```

### UnprocessableException (422)

Semantic errors, business rule violations.

```typescript
import { UnprocessableException } from "@fiyuu/core";

// Business rule violation
throw new UnprocessableException("Cannot cancel shipped order");

// With context
throw new UnprocessableException("Insufficient balance", {
  required: 100,
  available: 50,
});
```

### TooManyRequestsException (429)

Rate limit exceeded.

```typescript
import { TooManyRequestsException } from "@fiyuu/core";

// Simple
throw new TooManyRequestsException();

// With retry info
throw new TooManyRequestsException("Rate limit exceeded", {
  retryAfter: 60,  // seconds
  limit: 100,
  window: "1 minute",
});
```

### InternalServerException (500)

Unexpected server error.

```typescript
import { InternalServerException } from "@fiyuu/core";

// Usually caught by global handler
throw new InternalServerException("Database connection failed");
```

## Using in Controllers

```typescript
import { Controller, Get, Param } from "@fiyuu/core/decorators";
import { NotFoundException, ForbiddenException } from "@fiyuu/core";

@Controller("/api/users")
class UserController {
  constructor(private userService: UserService) {}
  
  @Get("/:id")
  async getById(@Param("id") id: string) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException("User not found", { id });
    }
    
    return user;
  }
  
  @Delete("/:id")
  async delete(@Param("id") id: string, @Req() req: Request) {
    const user = await this.userService.findById(id);
    
    if (!user) {
      throw new NotFoundException("User not found");
    }
    
    if (user.id !== req.user.id && req.user.role !== "admin") {
      throw new ForbiddenException("Cannot delete other users");
    }
    
    await this.userService.delete(id);
    return { success: true };
  }
}
```

## Using in Services

```typescript
@Service()
class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private paymentService: PaymentService
  ) {}
  
  async createOrder(userId: string, items: CartItem[]) {
    if (items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }
    
    const total = this.calculateTotal(items);
    const balance = await this.paymentService.getBalance(userId);
    
    if (balance < total) {
      throw new UnprocessableException("Insufficient balance", {
        required: total,
        available: balance,
      });
    }
    
    return this.orderRepo.create({ userId, items, total });
  }
  
  async cancelOrder(orderId: string, userId: string) {
    const order = await this.orderRepo.findById(orderId);
    
    if (!order) {
      throw new NotFoundException("Order not found");
    }
    
    if (order.userId !== userId) {
      throw new ForbiddenException("Cannot cancel other's order");
    }
    
    if (order.status === "shipped") {
      throw new UnprocessableException("Cannot cancel shipped order");
    }
    
    return this.orderRepo.update(orderId, { status: "cancelled" });
  }
}
```

## Exception Response Format

All exceptions return consistent JSON:

```json
{
  "error": "Error Name",
  "message": "Human-readable message",
  "statusCode": 404,
  "details": { /* optional additional data */ },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users/123"
}
```

## Custom Exceptions

Create your own exceptions by extending `HttpException`:

```typescript
import { HttpException } from "@fiyuu/core";

class PaymentRequiredException extends HttpException {
  constructor(message = "Payment required", details?: Record<string, any>) {
    super(402, message, details);
  }
}

class ServiceUnavailableException extends HttpException {
  constructor(message = "Service temporarily unavailable", details?: Record<string, any>) {
    super(503, message, details);
  }
}
```

Usage:

```typescript
throw new PaymentRequiredException("Please complete payment", {
  orderId: "123",
  amount: 99.99,
});
```

## Exception Handlers

### Global Handler

```typescript
// app/exception-handler.ts
import { ExceptionHandler } from "@fiyuu/core/decorators";

@ExceptionHandler()
class GlobalExceptionHandler {
  catch(error: Error, request: Request) {
    // Log error
    console.error(`[${request.method}] ${request.url}:`, error);
    
    // Handle known exceptions
    if (error instanceof HttpException) {
      return Response.json({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
        details: error.details,
        timestamp: new Date().toISOString(),
        path: request.url,
      }, { status: error.statusCode });
    }
    
    // Handle unknown errors
    return Response.json({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      statusCode: 500,
      timestamp: new Date().toISOString(),
      path: request.url,
    }, { status: 500 });
  }
}
```

### Controller-Specific Handler

```typescript
@Controller("/api/payments")
@ExceptionHandler(PaymentExceptionHandler)
class PaymentController {
  // All exceptions handled by PaymentExceptionHandler
}
```

### Async Error Handling

```typescript
async function riskyOperation() {
  try {
    await externalApi.call();
  } catch (error) {
    if (error.code === "TIMEOUT") {
      throw new ServiceUnavailableException("External service timeout");
    }
    throw new InternalServerException("External API error");
  }
}
```

## Validation Errors

Combine with Zod for automatic validation errors:

```typescript
import { z } from "zod";
import { BadRequestException } from "@fiyuu/core";

const UserSchema = z.object({
  email: z.string().email(),
  age: z.number().positive(),
});

function validateUser(data: unknown) {
  const result = UserSchema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join("."),
      message: e.message,
    }));
    
    throw new BadRequestException("Validation failed", { errors });
  }
  
  return result.data;
}
```

## Error Codes

Add error codes for client handling:

```typescript
throw new BadRequestException("Invalid request", {
  code: "VALIDATION_ERROR",
  errors: [...],
});

throw new UnauthorizedException("Token expired", {
  code: "TOKEN_EXPIRED",
});

throw new ForbiddenException("Permission denied", {
  code: "INSUFFICIENT_PERMISSIONS",
  required: ["admin"],
});
```

Client can check:

```typescript
if (error.details?.code === "TOKEN_EXPIRED") {
  refreshToken();
}
```

## Best Practices

1. **Use specific exceptions** - NotFound over generic Error
2. **Provide helpful messages** - "User not found" not "Error"
3. **Include context** - IDs, field names, constraints
4. **Don't leak internals** - Don't expose stack traces
5. **Log server-side** - Always log before throwing
6. **Consistent codes** - Use error codes for API clients

## HTTP Status Code Reference

| Exception | Status | Use Case |
|-----------|--------|----------|
| BadRequestException | 400 | Invalid input, validation errors |
| UnauthorizedException | 401 | Missing/invalid authentication |
| ForbiddenException | 403 | No permission for resource |
| NotFoundException | 404 | Resource doesn't exist |
| ConflictException | 409 | Duplicate, resource conflict |
| UnprocessableException | 422 | Business rule violation |
| TooManyRequestsException | 429 | Rate limit hit |
| InternalServerException | 500 | Unexpected server error |

## Next Steps

- Learn about [Decorators](./decorators.md) for structured code
- Explore [Database](./database.md) error handling
- Read [Authentication](../guides/authentication.md) guide
