# Example: Blog API

Complete blog API with posts, categories, comments, and authors.

## Structure

```
app/api/
├── posts/
│   ├── route.ts           # GET, POST /api/posts
│   └── [slug]/
│       └── route.ts       # GET, PUT, DELETE /api/posts/:slug
├── categories/
│   └── route.ts           # CRUD categories
├── comments/
│   └── route.ts           # Post comments
└── authors/
    └── route.ts           # Author profiles
```

## Database Schema

```sql
-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

-- Authors
CREATE TABLE authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  bio TEXT
);

-- Posts
CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published INTEGER DEFAULT 0,
  authorId TEXT NOT NULL,
  categoryId TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (authorId) REFERENCES authors(id),
  FOREIGN KEY (categoryId) REFERENCES categories(id)
);

-- Comments
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  postId TEXT NOT NULL,
  authorName TEXT NOT NULL,
  content TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (postId) REFERENCES posts(id)
);
```

## Posts API

```typescript
// app/api/posts/route.ts
import { db } from "@fiyuu/db";

// GET /api/posts?category=tech&page=1
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;
  
  let sql = `
    SELECT p.*, a.name as authorName, c.name as categoryName
    FROM posts p
    JOIN authors a ON p.authorId = a.id
    LEFT JOIN categories c ON p.categoryId = c.id
    WHERE p.published = 1
  `;
  const params: any[] = [];
  
  if (category) {
    sql += " AND c.slug = ?";
    params.push(category);
  }
  
  sql += " ORDER BY p.createdAt DESC LIMIT ? OFFSET ?";
  params.push(limit, (page - 1) * limit);
  
  const posts = await db.query(sql, params);
  return Response.json({ posts, page });
}

// POST /api/posts (protected)
export async function POST(request: Request) {
  const body = await request.json();
  
  const post = {
    id: crypto.randomUUID(),
    slug: slugify(body.title),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  await db.table("posts").insert(post);
  return Response.json(post, { status: 201 });
}

function slugify(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
```

## Single Post

```typescript
// app/api/posts/[slug]/route.ts
import { NotFoundException } from "@fiyuu/core";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const [post] = await db.query(`
    SELECT p.*, a.name as authorName, a.bio as authorBio
    FROM posts p
    JOIN authors a ON p.authorId = a.id
    WHERE p.slug = ?
  `, [params.slug]);
  
  if (!post) throw new NotFoundException("Post not found");
  
  // Get comments
  const comments = await db.query(
    "SELECT * FROM comments WHERE postId = ? ORDER BY createdAt DESC",
    [post.id]
  );
  
  return Response.json({ ...post, comments });
}
```

## Comments

```typescript
// app/api/comments/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const comment = {
    id: crypto.randomUUID(),
    postId: body.postId,
    authorName: body.authorName,
    content: body.content,
    createdAt: new Date().toISOString(),
  };
  
  await db.table("comments").insert(comment);
  
  // Broadcast to WebSocket
  const channel = realtime.channel("blog");
  channel.to(`post:${body.postId}`).emit("new-comment", comment);
  
  return Response.json(comment, { status: 201 });
}
```

## Usage

```bash
# List posts
curl http://localhost:4050/api/posts

# Filter by category
curl http://localhost:4050/api/posts?category=tech

# Get single post
curl http://localhost:4050/api/posts/hello-world

# Create post
curl -X POST http://localhost:4050/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","content":"World","authorId":"123"}'

# Add comment
curl -X POST http://localhost:4050/api/comments \
  -H "Content-Type: application/json" \
  -d '{"postId":"123","authorName":"John","content":"Nice!"}'
```
