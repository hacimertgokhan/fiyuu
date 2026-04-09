# @fiyuu/core

Core contracts, decorators, components, and DI container for the Fiyuu framework.

## Installation

```bash
npm install @fiyuu/core
```

## Contracts

Define type-safe routes with the 5-file contract system:

```typescript
import { defineQuery, defineAction, definePage, defineMeta, defineMiddleware } from "@fiyuu/core";
import { z } from "zod";

// Schema-driven query
export const query = defineQuery({
  input: z.object({ page: z.number().default(1) }),
  output: z.object({ users: z.array(z.object({ id: z.string(), name: z.string() })) }),
  description: "List users",
});

// Server action
export const action = defineAction({
  input: z.object({ name: z.string(), email: z.string().email() }),
  output: z.object({ success: z.boolean() }),
  description: "Create user",
});
```

## Decorators (Spring Boot Style)

```typescript
import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query,
  Service, Repository, Scheduled,
  Guard, UseGuard, ExceptionHandler,
  Injectable,
} from "@fiyuu/core/decorators";

@Controller("/api/users")
class UserController {
  constructor(private userService: UserService) {}

  @Get("/")
  async list() { return this.userService.findAll(); }

  @Get("/:id")
  async getById(@Param("id") id: string) { return this.userService.findById(id); }

  @Post("/")
  async create(@Body() dto: CreateUserDTO) { return this.userService.create(dto); }
}

@Service()
class UserService {
  constructor(private repo: UserRepository) {}
  async findAll() { return this.repo.findAll(); }
}

@Repository("users")
class UserRepository { ... }
```

## DTO Validation

```typescript
import { IsString, IsEmail, MinLength, IsOptional, validateDTO } from "@fiyuu/core/decorators";

class CreateUserDTO {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

const user = validateDTO(CreateUserDTO, requestBody);
```

## Components

```typescript
import { FiyuuImage, FiyuuVideo, FiyuuLink, FiyuuHead } from "@fiyuu/core/components";

FiyuuImage({ src: "/hero.jpg", alt: "Hero", width: 1200, height: 600 });
FiyuuVideo({ src: "/demo.mp4", width: 1280, height: 720, poster: "/poster.jpg" });
FiyuuLink({ href: "/about", children: "About", prefetch: true });
FiyuuHead({ title: "My Page", description: "SEO description" });
```

## HTTP Exceptions

```typescript
import { NotFoundException, BadRequestException, UnauthorizedException } from "@fiyuu/core";

throw new NotFoundException("User not found");
throw new BadRequestException("Invalid email", { field: "email" });
```

## License

MIT
