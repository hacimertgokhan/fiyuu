# CRUD Operations Guide

Complete REST API with validation, pagination, and error handling.

## Project Structure

```
app/api/items/
├── route.ts       # GET, POST
└── [id]/
    └── route.ts   # GET, PUT, PATCH, DELETE
```

## Schema

```typescript
// app/api/items/schema.ts
import { z } from "zod";

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  createdAt: z.string().datetime(),
});

export const CreateItemSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export type Item = z.infer<typeof ItemSchema>;
```

## List & Create

```typescript
// app/api/items/route.ts
import { db } from "@fiyuu/db";
import { CreateItemSchema } from "./schema.js";
import { BadRequestException } from "@fiyuu/core";

// GET /api/items?page=1&limit=20
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  
  const items = await db.query(
    "SELECT * FROM items ORDER BY createdAt DESC LIMIT ? OFFSET ?",
    [limit, (page - 1) * limit]
  );
  
  const [{ count }] = await db.query("SELECT COUNT(*) as count FROM items");
  
  return Response.json({
    items,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
    },
  });
}

// POST /api/items
export async function POST(request: Request) {
  const body = await request.json();
  
  const result = CreateItemSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException("Validation failed", {
      errors: result.error.errors,
    });
  }
  
  const item = {
    id: crypto.randomUUID(),
    ...result.data,
    createdAt: new Date().toISOString(),
  };
  
  await db.table("items").insert(item);
  
  return Response.json(item, { status: 201 });
}
```

## Read, Update, Delete

```typescript
// app/api/items/[id]/route.ts
import { db } from "@fiyuu/db";
import { UpdateItemSchema } from "../schema.js";
import { NotFoundException, BadRequestException } from "@fiyuu/core";

// GET /api/items/:id
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const [item] = await db.query("SELECT * FROM items WHERE id = ?", [params.id]);
  
  if (!item) {
    throw new NotFoundException("Item not found");
  }
  
  return Response.json(item);
}

// PUT /api/items/:id (full update)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  const result = CreateItemSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException("Validation failed");
  }
  
  const existing = await db.table("items").findOne({ id: params.id });
  if (!existing) {
    throw new NotFoundException("Item not found");
  }
  
  const updated = { ...existing, ...result.data };
  await db.table("items").update({ id: params.id }, updated);
  
  return Response.json(updated);
}

// PATCH /api/items/:id (partial update)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  
  const result = UpdateItemSchema.safeParse(body);
  if (!result.success) {
    throw new BadRequestException("Validation failed");
  }
  
  const existing = await db.table("items").findOne({ id: params.id });
  if (!existing) {
    throw new NotFoundException("Item not found");
  }
  
  await db.table("items").update({ id: params.id }, result.data);
  
  return Response.json({ ...existing, ...result.data });
}

// DELETE /api/items/:id
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const existing = await db.table("items").findOne({ id: params.id });
  if (!existing) {
    throw new NotFoundException("Item not found");
  }
  
  await db.table("items").delete({ id: params.id });
  
  return Response.json({ success: true });
}
```

## Search & Filter

```typescript
// GET /api/items?search=keyword&minPrice=10&maxPrice=100
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const search = searchParams.get("search");
  const minPrice = parseFloat(searchParams.get("minPrice") || "0");
  const maxPrice = parseFloat(searchParams.get("maxPrice") || "Infinity");
  
  let sql = "SELECT * FROM items WHERE price >= ? AND price <= ?";
  const params: any[] = [minPrice, maxPrice];
  
  if (search) {
    sql += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  sql += " ORDER BY createdAt DESC";
  
  const items = await db.query(sql, params);
  return Response.json({ items });
}
```

## Error Handling

```typescript
// app/exception-handler.ts
import { ExceptionHandler } from "@fiyuu/core/decorators";
import { HttpException } from "@fiyuu/core";

@ExceptionHandler()
export class APIExceptionHandler {
  catch(error: Error) {
    if (error instanceof HttpException) {
      return Response.json({
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
      }, { status: error.statusCode });
    }
    
    return Response.json({
      error: "Internal Server Error",
      message: "Something went wrong",
    }, { status: 500 });
  }
}
```

## Testing

```bash
# Create
curl -X POST http://localhost:4050/api/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Laptop","price":999}'

# List
curl http://localhost:4050/api/items?page=1&limit=10

# Get one
curl http://localhost:4050/api/items/123

# Update
curl -X PATCH http://localhost:4050/api/items/123 \
  -H "Content-Type: application/json" \
  -d '{"price":899}'

# Delete
curl -X DELETE http://localhost:4050/api/items/123
```
