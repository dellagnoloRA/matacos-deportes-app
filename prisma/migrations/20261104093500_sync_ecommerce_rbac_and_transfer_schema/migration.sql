-- CreateEnum
CREATE TYPE "ShippingStatus" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'LISTO_RETIRO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO');

-- AlterEnum
ALTER TYPE "PaymentMethod" ADD VALUE 'MERCADOPAGO_ONLINE';

-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'PENDIENTE_VERIFICACION';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerDni" TEXT,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "reconciledAt" TIMESTAMP(3),
ADD COLUMN     "reconciledBy" TEXT,
ADD COLUMN     "reconciliationNotes" TEXT,
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCity" TEXT,
ADD COLUMN     "shippingCost" DECIMAL(12,2) DEFAULT 0,
ADD COLUMN     "shippingMethod" TEXT,
ADD COLUMN     "shippingPostalCode" TEXT,
ADD COLUMN     "shippingStatus" "ShippingStatus" NOT NULL DEFAULT 'PENDIENTE',
ADD COLUMN     "shippingTrackingCode" TEXT,
ADD COLUMN     "transferProofUploadedAt" TIMESTAMP(3),
ADD COLUMN     "transferProofUrl" TEXT;

-- AlterTable
ALTER TABLE "SalePayment" ADD COLUMN     "reconciliationNotes" TEXT,
ADD COLUMN     "transferProofUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileId" TEXT,
ADD COLUMN     "username" TEXT,
ALTER COLUMN "role" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "dni" TEXT,
    "defaultAddress" TEXT,
    "defaultCity" TEXT DEFAULT 'Formosa',
    "defaultPostalCode" TEXT DEFAULT '3600',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "parentProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilePermission" (
    "profileId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,

    CONSTRAINT "ProfilePermission_pkey" PRIMARY KEY ("profileId","permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_googleId_key" ON "Customer"("googleId");

-- CreateIndex
CREATE INDEX "Customer_email_idx" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Favorite_customerId_idx" ON "Favorite"("customerId");

-- CreateIndex
CREATE INDEX "Favorite_productId_idx" ON "Favorite"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_customerId_productId_key" ON "Favorite"("customerId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_name_key" ON "Profile"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_code_key" ON "Permission"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_parentProfileId_fkey" FOREIGN KEY ("parentProfileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePermission" ADD CONSTRAINT "ProfilePermission_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilePermission" ADD CONSTRAINT "ProfilePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

