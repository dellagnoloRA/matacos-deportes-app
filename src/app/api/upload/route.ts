import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import {
  generateBannerImageFilename,
  generateProductImageFilename,
} from "@/lib/textUtils";

// Configuración de subida para Productos (Catálogo)
const PRODUCT_MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const PRODUCT_ALLOWED_TYPES = [
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

// Configuración estricta de subida para Banners Promocionales (RF-26: WebP/PNG/JPEG, máx 2MB y videos MP4/WebM)
const BANNER_MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB para imágenes
const BANNER_ALLOWED_TYPES = [
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/jpg",
];

const BANNER_VIDEO_MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB para videos
const BANNER_VIDEO_ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
];

type UploadTarget = "banner" | "product";

function resolveUploadTarget(request: Request, formData: FormData): UploadTarget {
  let queryTarget = "";
  try {
    const parsedUrl = new URL(request.url, "http://localhost:3000");
    queryTarget = (
      parsedUrl.searchParams.get("type") ||
      parsedUrl.searchParams.get("folder") ||
      ""
    )
      .trim()
      .toLowerCase();
  } catch {
    queryTarget = "";
  }

  const formTarget = String(
    formData.get("type") ||
      formData.get("folder") ||
      formData.get("entity") ||
      ""
  )
    .trim()
    .toLowerCase();

  const rawTarget = formTarget || queryTarget;

  if (rawTarget === "banner" || rawTarget === "banners") {
    return "banner";
  }

  if (rawTarget === "product" || rawTarget === "products") {
    return "product";
  }

  // Retrocompatibilidad: ProductFormModal envía siempre productName o brand
  if (formData.has("productName") || formData.has("brand")) {
    return "product";
  }

  return "banner";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawFile = formData.get("file");

    if (!rawFile || !(rawFile instanceof File)) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de imagen válido" },
        { status: 400 }
      );
    }

    if (rawFile.size <= 0) {
      return NextResponse.json(
        { error: "El archivo de imagen está vacío" },
        { status: 400 }
      );
    }

    const file = rawFile;
    const uploadTarget = resolveUploadTarget(request, formData);

    // =========================================================================
    // =========================================================================
    // FLUJO 1: SUBIDA DE IMÁGENES O VIDEOS PARA BANNERS PROMOCIONALES (RF-26)
    // =========================================================================
    if (uploadTarget === "banner") {
      const isVideo = file.type.toLowerCase().startsWith("video/");

      if (isVideo) {
        if (!BANNER_VIDEO_ALLOWED_TYPES.includes(file.type.toLowerCase())) {
          return NextResponse.json(
            {
              error:
                "Formato de video no permitido. Solo se aceptan videos MP4, WebM o MOV.",
            },
            { status: 400 }
          );
        }

        if (file.size > BANNER_VIDEO_MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              error:
                "El video del banner supera el límite máximo permitido de 30 MB.",
            },
            { status: 400 }
          );
        }

        const title = String(formData.get("title") || "").trim();
        const variant = String(formData.get("variant") || "")
          .trim()
          .toLowerCase();

        const arrayBuffer = await file.arrayBuffer();
        const outputBuffer = Buffer.from(arrayBuffer);
        const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";

        const finalFilename = generateBannerImageFilename({
          title: title || null,
          variant:
            variant === "mobile" || variant === "desktop" ? variant : null,
          originalName: file.name,
          extension: ext,
        });

        if (process.env.BLOB_READ_WRITE_TOKEN) {
          try {
            const blob = await put(`banners/${finalFilename}`, outputBuffer, {
              access: "public",
              contentType: file.type || "video/mp4",
              addRandomSuffix: false,
            });

            return NextResponse.json({
              url: blob.url,
              filename: finalFilename,
              originalSize: file.size,
              size: outputBuffer.length,
              type: file.type || "video/mp4",
              category: "banner",
              provider: "vercel-blob",
            });
          } catch (blobError) {
            console.warn(
              "Fallo al subir banner de video a Vercel Blob, usando almacenamiento local:",
              blobError
            );
          }
        }

        const uploadDir = path.join(
          process.cwd(),
          "public",
          "uploads",
          "banners"
        );
        await fs.mkdir(uploadDir, { recursive: true });

        const filePath = path.join(uploadDir, finalFilename);
        await fs.writeFile(filePath, outputBuffer);

        return NextResponse.json({
          url: `/uploads/banners/${finalFilename}`,
          filename: finalFilename,
          originalSize: file.size,
          size: outputBuffer.length,
          type: file.type || "video/mp4",
          category: "banner",
          provider: "local-storage",
        });
      }

      // Si es imagen:
      if (!BANNER_ALLOWED_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            error:
              "Formato no permitido para banners. Solo se aceptan imágenes WebP, PNG o JPEG.",
          },
          { status: 400 }
        );
      }

      if (file.size > BANNER_MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error:
              "La imagen del banner supera el límite máximo permitido de 2 MB.",
          },
          { status: 400 }
        );
      }

      const title = String(formData.get("title") || "").trim();
      const variant = String(formData.get("variant") || "")
        .trim()
        .toLowerCase();

      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);

      const maxWidth = variant === "mobile" ? 1080 : 1920;
      const maxHeight = variant === "mobile" ? 1920 : 1080;

      const outputBuffer = await sharp(inputBuffer)
        .rotate()
        .resize(maxWidth, maxHeight, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();

      const outputContentType = "image/webp";
      const finalFilename = generateBannerImageFilename({
        title: title || null,
        variant:
          variant === "mobile" || variant === "desktop" ? variant : null,
        originalName: file.name,
      });

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const blob = await put(`banners/${finalFilename}`, outputBuffer, {
            access: "public",
            contentType: outputContentType,
            addRandomSuffix: false,
          });

          return NextResponse.json({
            url: blob.url,
            filename: finalFilename,
            originalSize: file.size,
            size: outputBuffer.length,
            type: outputContentType,
            category: "banner",
            provider: "vercel-blob",
          });
        } catch (blobError) {
          console.warn(
            "Fallo al subir banner a Vercel Blob, usando almacenamiento local:",
            blobError
          );
        }
      }

      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "banners"
      );
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, finalFilename);
      await fs.writeFile(filePath, outputBuffer);

      return NextResponse.json({
        url: `/uploads/banners/${finalFilename}`,
        filename: finalFilename,
        originalSize: file.size,
        size: outputBuffer.length,
        type: outputContentType,
        category: "banner",
        provider: "local-storage",
      });
    }

    // =========================================================================
    // FLUJO 2: SUBIDA DE IMÁGENES PARA PRODUCTOS DEL CATÁLOGO
    // =========================================================================
    const brand = String(formData.get("brand") || "");
    const productName = String(formData.get("productName") || "");
    const color = String(formData.get("color") || "");
    const order = Number(formData.get("order")) || 1;
    const isPrimary = formData.get("isPrimary") === "true";

    if (!PRODUCT_ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        {
          error:
            "Formato no permitido. Utiliza PNG, JPG, WEBP, GIF, AVIF o SVG.",
        },
        { status: 400 }
      );
    }

    if (file.size > PRODUCT_MAX_FILE_SIZE) {
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

    if (file.type.toLowerCase() === "image/svg+xml") {
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

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`products/${finalFilename}`, outputBuffer, {
          access: "public",
          contentType: outputContentType,
          addRandomSuffix: false,
        });

        return NextResponse.json({
          url: blob.url,
          filename: finalFilename,
          originalSize: file.size,
          size: outputBuffer.length,
          type: outputContentType,
          category: "product",
          provider: "vercel-blob",
        });
      } catch (blobError) {
        console.warn(
          "Fallo al subir a Vercel Blob, usando almacenamiento local:",
          blobError
        );
      }
    }

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
      category: "product",
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
