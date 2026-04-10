# File Uploads Guide

Handle multipart uploads, image processing, and storage.

## Basic Upload

```typescript
// app/api/upload/route.ts
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }
  
  // Validate
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only images allowed" }, { status: 400 });
  }
  
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  
  // Save file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const filename = `${crypto.randomUUID()}-${file.name}`;
  const filepath = `./uploads/${filename}`;
  
  await fs.writeFile(filepath, buffer);
  
  // Save reference to database
  await db.table("uploads").insert({
    id: crypto.randomUUID(),
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url: `/uploads/${filename}`,
    createdAt: new Date().toISOString(),
  });
  
  return Response.json({
    success: true,
    url: `/uploads/${filename}`,
    filename,
  });
}
```

## Multiple Files

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  
  const uploaded = [];
  
  for (const file of files) {
    const result = await saveFile(file);
    uploaded.push(result);
  }
  
  return Response.json({ files: uploaded });
}
```

## Client-Side Upload

```html
<form id="upload-form" enctype="multipart/form-data">
  <input type="file" name="file" accept="image/*" />
  <button type="submit">Upload</button>
</form>

<script>
  document.getElementById('upload-form').onsubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });
    
    const data = await res.json();
    console.log('Uploaded:', data.url);
  };
</script>
```

## With Metadata

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  
  const file = formData.get("file") as File;
  const title = formData.get("title") as string;
  const tags = formData.get("tags") as string;
  
  // Save file
  const result = await saveFile(file);
  
  // Save with metadata
  await db.table("files").insert({
    id: crypto.randomUUID(),
    ...result,
    title,
    tags: tags.split(",").map(t => t.trim()),
    uploadedBy: getCurrentUserId(),
  });
  
  return Response.json({ success: true });
}
```

## Configuration

```typescript
// fiyuu.config.ts
export default {
  upload: {
    maxSize: 10 * 1024 * 1024,  // 10MB
    allowedTypes: ["image/*", "application/pdf"],
    destination: "./uploads",
  },
};
```

## Best Practices

1. **Validate file types** - Check MIME type
2. **Limit file size** - Prevent abuse
3. **Generate unique names** - Prevent collisions
4. **Scan for malware** - If possible
5. **Store metadata** - Original name, size, etc.
6. **Use CDN** - For production serving
