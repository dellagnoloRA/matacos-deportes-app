-- phase: expand
-- Agrega los enums ReviewStatus y FitFeedback, los agregados de reseñas en Product,
-- las tablas ProductReview y ReviewReport, y siembra el permiso RBAC ecommerce.resenas.

-- CreateEnum (idempotente)
DO $$
BEGIN
    CREATE TYPE "ReviewStatus" AS ENUM ('PUBLICADA', 'OCULTA', 'EN_REVISION');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
    CREATE TYPE "FitFeedback" AS ENUM ('CHICO', 'EXACTO', 'HOLGADO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable: agregados desnormalizados en Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "ratingAverage" DECIMAL(3,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "reviewsCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: ProductReview
CREATE TABLE IF NOT EXISTS "ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "purchasedSize" TEXT,
    "fitFeedback" "FitFeedback",
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "saleId" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLICADA',
    "moderationReason" TEXT,
    "adminResponse" TEXT,
    "adminResponseAt" TIMESTAMP(3),
    "adminResponderId" TEXT,
    "reportsCount" INTEGER NOT NULL DEFAULT 0,
    "helpfulVotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProductReview_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5)
);

-- CreateTable: ReviewReport
CREATE TABLE IF NOT EXISTS "ReviewReport" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "reporterId" TEXT,
    "reason" TEXT NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotentes)
CREATE UNIQUE INDEX IF NOT EXISTS "ProductReview_productId_customerId_key" ON "ProductReview"("productId", "customerId");
CREATE INDEX IF NOT EXISTS "ProductReview_productId_status_createdAt_idx" ON "ProductReview"("productId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductReview_customerId_idx" ON "ProductReview"("customerId");
CREATE INDEX IF NOT EXISTS "ProductReview_status_reportsCount_idx" ON "ProductReview"("status", "reportsCount");
CREATE INDEX IF NOT EXISTS "ReviewReport_reviewId_idx" ON "ReviewReport"("reviewId");
CREATE INDEX IF NOT EXISTS "ReviewReport_reviewId_reporterId_idx" ON "ReviewReport"("reviewId", "reporterId");

-- AddForeignKey (idempotentes)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductReview_productId_fkey') THEN
        ALTER TABLE "ProductReview"
        ADD CONSTRAINT "ProductReview_productId_fkey"
        FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductReview_customerId_fkey') THEN
        ALTER TABLE "ProductReview"
        ADD CONSTRAINT "ProductReview_customerId_fkey"
        FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductReview_saleId_fkey') THEN
        ALTER TABLE "ProductReview"
        ADD CONSTRAINT "ProductReview_saleId_fkey"
        FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ProductReview_adminResponderId_fkey') THEN
        ALTER TABLE "ProductReview"
        ADD CONSTRAINT "ProductReview_adminResponderId_fkey"
        FOREIGN KEY ("adminResponderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReviewReport_reviewId_fkey') THEN
        ALTER TABLE "ReviewReport"
        ADD CONSTRAINT "ReviewReport_reviewId_fkey"
        FOREIGN KEY ("reviewId") REFERENCES "ProductReview"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ReviewReport_reporterId_fkey') THEN
        ALTER TABLE "ReviewReport"
        ADD CONSTRAINT "ReviewReport_reporterId_fkey"
        FOREIGN KEY ("reporterId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Semilla idempotente del permiso RBAC ecommerce.resenas y asignación a Administrador y Encargado de Local
INSERT INTO "Permission" ("id", "code", "module", "description")
VALUES (
    gen_random_uuid()::text,
    'ecommerce.resenas',
    'ECOMMERCE',
    'Moderar, ocultar y responder reseñas de clientes en la tienda online'
)
ON CONFLICT ("code") DO UPDATE SET
    "module" = EXCLUDED."module",
    "description" = EXCLUDED."description";

INSERT INTO "ProfilePermission" ("profileId", "permissionId")
SELECT prof."id", perm."id"
FROM "Profile" prof
CROSS JOIN "Permission" perm
WHERE perm."code" = 'ecommerce.resenas'
  AND prof."name" IN ('Administrador', 'Encargado de Local')
ON CONFLICT ("profileId", "permissionId") DO NOTHING;
