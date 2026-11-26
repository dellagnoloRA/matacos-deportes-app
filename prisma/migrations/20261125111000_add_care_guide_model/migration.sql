-- phase: expand
-- Agrega la entidad reutilizable CareGuide y la relación opcional Product.careGuideId

-- CreateTable
CREATE TABLE IF NOT EXISTS "CareGuide" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INDUMENTARIA',
    "summary" TEXT,
    "instructions" JSONB NOT NULL,
    "warning" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CareGuide_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "careGuideId" TEXT;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Product_careGuideId_fkey'
    ) THEN
        ALTER TABLE "Product"
        ADD CONSTRAINT "Product_careGuideId_fkey"
        FOREIGN KEY ("careGuideId") REFERENCES "CareGuide"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
