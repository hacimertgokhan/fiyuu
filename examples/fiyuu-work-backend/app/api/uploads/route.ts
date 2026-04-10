import { writeFile } from "node:fs/promises";
import { mkdir } from "node:fs/promises";
import { AuthGuard } from "../../guards/auth.guard.js";
import { WorkspaceGuard } from "../../guards/workspace.guard.js";
import { db } from "@fiyuu/db";
import { BadRequestException } from "@fiyuu/core";

// POST /api/uploads - Upload file
export async function POST(request: Request) {
  const guard = new AuthGuard();
  await guard.canActivate(request);
  
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const workspaceId = formData.get("workspaceId") as string;
  const taskId = formData.get("taskId") as string | undefined;
  
  if (!file) {
    throw new BadRequestException("No file provided");
  }
  
  // Validate file
  if (file.size > 10 * 1024 * 1024) {
    throw new BadRequestException("File too large (max 10MB)");
  }
  
  // Verify workspace access if workspaceId provided
  if (workspaceId) {
    const wsGuard = new WorkspaceGuard();
    const modifiedRequest = new Request(`http://localhost/workspaces/${workspaceId}`, {
      headers: request.headers,
    });
    await wsGuard.canActivate(modifiedRequest);
  }
  
  // Save file
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const filename = `${crypto.randomUUID()}-${file.name}`;
  const uploadDir = "./uploads";
  const filepath = `${uploadDir}/${filename}`;
  
  await mkdir(uploadDir, { recursive: true });
  await writeFile(filepath, buffer);
  
  // Save reference
  const upload = await db.table("uploads").insert({
    id: crypto.randomUUID(),
    filename,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    url: `/uploads/${filename}`,
    uploadedBy: (request as any).user.id,
    workspaceId: workspaceId || null,
    taskId: taskId || null,
    createdAt: new Date().toISOString(),
  });
  
  return Response.json({
    upload: {
      id: upload.id,
      url: upload.url,
      originalName: upload.originalName,
      size: upload.size,
    },
  }, { status: 201 });
}
