-- AlterTable
ALTER TABLE "Discipline" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "discountActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountEndDate" TIMESTAMP(3),
ADD COLUMN     "discountPercentage" DECIMAL(5,2),
ADD COLUMN     "discountPrice" DECIMAL(12,2),
ADD COLUMN     "discountStartDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Product_active_createdAt_idx" ON "Product"("active", "createdAt");

-- CreateIndex
CREATE INDEX "Product_active_discountActive_idx" ON "Product"("active", "discountActive");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "Sale_status_idx" ON "Sale"("status");

-- CreateIndex
CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");

-- CreateIndex
CREATE INDEX "SaleItem_variantId_idx" ON "SaleItem"("variantId");
