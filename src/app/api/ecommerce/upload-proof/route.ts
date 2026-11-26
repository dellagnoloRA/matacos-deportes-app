import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";

// Tamaño máximo permitido: 10MB para comprobantes (imágenes o PDF)
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orderId = (formData.get("orderId") as string) || "transfer";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de comprobante" },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Solo se aceptan imágenes (JPG, PNG, WEBP) o documentos PDF.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "El archivo supera el tamaño máximo permitido de 10 MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    // Sanitizar nombre de archivo
    const cleanOrderId = orderId.replace(/[^a-zA-Z0-9-_]/g, "").slice(0, 30);
    const randomHash = crypto.randomBytes(6).toString("hex");
    const extension = file.type === "application/pdf" ? "pdf" : "webp";

    let finalBuffer: Buffer = inputBuffer;
    let finalExtension = extension;

    // Si es imagen, podemos optimizar o guardar directamente
    if (file.type !== "application/pdf") {
      try {
        const sharp = (await import("sharp")).default;
        finalBuffer = await sharp(inputBuffer)
          .rotate()
          .resize(1600, 1600, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();
        finalExtension = "webp";
      } catch (sharpError) {
        console.warn("Sharp no pudo procesar la imagen, se guardará original:", sharpError);
        const originalExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
        finalExtension = originalExt.replace(/[^a-z0-9]/g, "");
      }
    }

    const timestamp = Date.now();
    const finalFilename = `comprobante_${cleanOrderId}_${timestamp}_${randomHash}.${finalExtension}`;

    // Directorio local en Saavedra 241
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "comprobantes"
    );
    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, finalFilename);
    await fs.writeFile(filePath, finalBuffer);

    const publicUrl = `/uploads/comprobantes/${finalFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: finalFilename,
      size: finalBuffer.length,
      mimeType: file.type,
    });
  } catch (error) {
    console.error("Error en POST /api/ecommerce/upload-proof:", error);
    return NextResponse.json(
      { error: "Error interno al procesar y almacenar el comprobante" },
      { status: 500 }
    );
  }
}
