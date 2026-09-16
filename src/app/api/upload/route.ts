import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";

// Tamaño máximo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de imagen" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Utiliza PNG, JPG, WEBP, GIF o SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen supera el límite permitido de 5 MB." },
        { status: 400 }
      );
    }

    // Sanitizar nombre de archivo
    const timestamp = Date.now();
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, "-")
      .replace(/-+/g, "-");
    const uniqueFilename = `product-${timestamp}-${sanitizedName}`;

    // 1. Si existe token de Vercel Blob, almacenar en Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`products/${uniqueFilename}`, file, {
          access: "public",
        });

        return NextResponse.json({
          url: blob.url,
          filename: uniqueFilename,
          size: file.size,
          type: file.type,
          provider: "vercel-blob",
        });
      } catch (blobError) {
        console.warn("Fallo al subir a Vercel Blob, usando almacenamiento local:", blobError);
      }
    }

    // 2. Almacenamiento Local (Saavedra 241 Offline-First / Desarrollo)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueFilename);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const localUrl = `/uploads/products/${uniqueFilename}`;

    return NextResponse.json({
      url: localUrl,
      filename: uniqueFilename,
      size: file.size,
      type: file.type,
      provider: "local-storage",
    });
  } catch (error) {
    console.error("Error en POST /api/upload:", error);
    return NextResponse.json(
      { error: "Error interno al procesar la subida de la imagen" },
      { status: 500 }
    );
  }
}
