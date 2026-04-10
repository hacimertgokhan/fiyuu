# Example: E-Commerce API

Product catalog, cart, orders, and payments.

## Structure

```
app/api/
├── products/
│   ├── route.ts           # List products
│   └── [id]/route.ts      # Product details
├── cart/
│   └── route.ts           # Cart operations
├── orders/
│   └── route.ts           # Order management
└── checkout/
    └── route.ts           # Payment processing
```

## Products

```typescript
// app/api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  
  let sql = "SELECT * FROM products WHERE 1=1";
  const params: any[] = [];
  
  if (category) {
    sql += " AND category = ?";
    params.push(category);
  }
  
  if (search) {
    sql += " AND (name LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  
  const products = await db.query(sql, params);
  return Response.json({ products });
}
```

## Cart

```typescript
// app/api/cart/route.ts
import { AuthGuard } from "../../guards/auth.guard.js";

export async function GET(request: Request) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  const items = await db.query(`
    SELECT c.*, p.name, p.price, p.image
    FROM cart_items c
    JOIN products p ON c.productId = p.id
    WHERE c.userId = ?
  `, [userId]);
  
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  return Response.json({ items, total });
}

export async function POST(request: Request) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  const { productId, quantity } = await request.json();
  
  // Check if exists
  const existing = await db.table("cart_items").findOne({ userId, productId });
  
  if (existing) {
    await db.query(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?",
      [quantity, existing.id]
    );
  } else {
    await db.table("cart_items").insert({
      id: crypto.randomUUID(),
      userId,
      productId,
      quantity,
    });
  }
  
  return Response.json({ success: true });
}
```

## Orders

```typescript
// app/api/orders/route.ts
export async function POST(request: Request) {
  await new AuthGuard().canActivate(request);
  const userId = (request as any).user.id;
  
  const { items, shippingAddress } = await request.json();
  
  // Calculate total
  const total = await calculateTotal(items);
  
  // Create order
  const order = await db.transaction(async (tx) => {
    const orderId = crypto.randomUUID();
    
    await tx.table("orders").insert({
      id: orderId,
      userId,
      total,
      status: "pending",
      shippingAddress,
      createdAt: new Date().toISOString(),
    });
    
    for (const item of items) {
      await tx.table("order_items").insert({
        id: crypto.randomUUID(),
        orderId,
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
      });
    }
    
    // Clear cart
    await tx.table("cart_items").delete({ userId });
    
    return orderId;
  });
  
  return Response.json({ orderId: order }, { status: 201 });
}
```

## Key Features

- Product search & filtering
- Cart persistence
- Transactional order creation
- Inventory tracking
- Order history
