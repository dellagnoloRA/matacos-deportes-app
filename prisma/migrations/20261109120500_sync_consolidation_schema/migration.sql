-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "dimensionsCm" JSONB,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "installments" INTEGER NOT NULL DEFAULT 6,
ADD COLUMN     "listPrice" DECIMAL(12,2),
ADD COLUMN     "metaDescription" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "sizeGuideId" TEXT,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "specs" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
ADD COLUMN     "subcategoryId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "vatRate" DECIMAL(5,2) NOT NULL DEFAULT 21.0,
ADD COLUMN     "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "reservedUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SizeGuide" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT,
    "gender" TEXT NOT NULL DEFAULT 'UNISEX',
    "type" TEXT NOT NULL DEFAULT 'CALZADO',
    "unit" TEXT NOT NULL DEFAULT 'cm',
    "fitNote" TEXT,
    "columns" JSONB NOT NULL,
    "rows" JSONB NOT NULL,
    "guideImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SizeGuide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductDraft" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "step" INTEGER NOT NULL DEFAULT 1,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "storeName" TEXT NOT NULL DEFAULT 'Matacos Deportes',
    "whatsappNumber" TEXT NOT NULL DEFAULT '5493704000000',
    "contactPhone" TEXT NOT NULL DEFAULT '+54 370 4429999',
    "contactEmail" TEXT NOT NULL DEFAULT 'ventas@matacosdeportes.com',
    "notificationsEmail" TEXT DEFAULT 'notificaciones@matacosdeportes.com',
    "storeAddress" TEXT NOT NULL DEFAULT 'Saavedra 241',
    "storeCity" TEXT NOT NULL DEFAULT 'Formosa Capital',
    "storePostalCode" TEXT NOT NULL DEFAULT '3600',
    "businessHours" TEXT NOT NULL DEFAULT 'Lunes a Sábado de 08:30 a 12:30 y de 16:30 a 20:30 hs',
    "instagramHandle" TEXT NOT NULL DEFAULT '@matacosdeportes',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subcategory_categoryId_slug_key" ON "Subcategory"("categoryId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Sale_channel_status_reservedUntil_idx" ON "Sale"("channel", "status", "reservedUntil");

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SizeGuide" ADD CONSTRAINT "SizeGuide_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_sizeGuideId_fkey" FOREIGN KEY ("sizeGuideId") REFERENCES "SizeGuide"("id") ON DELETE SET NULL ON UPDATE CASCADE;
