import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import { generateProductImageFilename } from "@/lib/textUtils";

// Tamaño máximo de entrada: 15MB (Sharp lo comprimirá a ~80-180KB en el servidor)
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
  "image/heic",
  "image/heif",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const brand = (formData.get("brand") as string) || "";
    const productName = (formData.get("productName") as string) || "";
    const color = (formData.get("color") as string) || "";
    const order = Number(formData.get("order")) || 1;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de imagen" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Utiliza PNG, JPG, WEBP, GIF, AVIF o SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "La imagen supera el límite permitido de 15 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    let outputBuffer: Buffer;
    let outputContentType = "image/webp";
    let finalFilename: string;

    // 1. Manejo según formato: Vectorial SVG vs Rasterizado WebP
    if (file.type === "image/svg+xml") {
      outputBuffer = inputBuffer;
      outputContentType = "image/svg+xml";
      finalFilename = generateProductImageFilename({
        brand,
        productName,
        color,
        order,
        isPrimary,
      }).replace(/\.webp$/, ".svg");
    } else {
      // Optimización con Sharp:
      // - rotate(): Corrige automáticamente la orientación según metadatos EXIF (fotos de smartphone)
      // - resize(): Proporcional a máx 1200x1200px sin distorsionar ni agrandar fotos más pequeñas
      // - webp(): Conversión a WebP con calidad 82 y esfuerzo de compresión 4
      outputBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();

      finalFilename = generateProductImageFilename({
        brand,
        productName,
        color,
        order,
        isPrimary,
      });
    }

    // 2. Si existe token de Vercel Blob, almacenar en la nube (Vercel Blob)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`products/${finalFilename}`, outputBuffer, {
          access: "public",
          contentType: outputContentType,
          addRandomSuffix: false, // Nuestro generador ya añade un sufijo único seguro
        });

        return NextResponse.json({
          url: blob.url,
          filename: finalFilename,
          originalSize: file.size,
          size: outputBuffer.length,
          type: outputContentType,
          provider: "vercel-blob",
        });
      } catch (blobError) {
        console.warn("Fallo al subir a Vercel Blob, usando almacenamiento local:", blobError);
      }
    }

    // 3. Almacenamiento Local (Saavedra 241 Offline-First / Desarrollo)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, finalFilename);
    await fs.writeFile(filePath, outputBuffer);

    const localUrl = `/uploads/products/${finalFilename}`;

    return NextResponse.json({
      url: localUrl,
      filename: finalFilename,
      originalSize: file.size,
      size: outputBuffer.length,
      type: outputContentType,
      provider: "local-storage",
    });
  } catch (error) {
    console.error("Error en POST /api/upload:", error);
    return NextResponse.json(
      { error: "Error interno al procesar y optimizar la imagen con Sharp" },
      { status: 500 }
    );
  }
}

