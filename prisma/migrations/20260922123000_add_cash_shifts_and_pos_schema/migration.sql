-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('PENDIENTE_PAGO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "CashShiftStatus" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "CashMovementType" AS ENUM ('INGRESO_EXTRAORDINARIO', 'RETIRO_CAJA_FUERTE', 'GASTO_MENOR', 'AJUSTE_ARQUEO');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "ignoreAlerts" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN "cashShiftId" TEXT,
ADD COLUMN "cashierId" TEXT,
ADD COLUMN "customerName" TEXT,
ADD COLUMN "discountType" "DiscountType",
ADD COLUMN "discountValue" DECIMAL(12,2),
ADD COLUMN "notes" TEXT,
ADD COLUMN "offlineId" TEXT,
ADD COLUMN "sellerId" TEXT,
ADD COLUMN "subtotalGross" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "syncedAt" TIMESTAMP(3),
ADD COLUMN "ticketCode" TEXT,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Convert Sale.status to enum SaleStatus safely
ALTER TABLE "Sale" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Sale" ALTER COLUMN "status" TYPE "SaleStatus" USING ("status"::text::"SaleStatus");
ALTER TABLE "Sale" ALTER COLUMN "status" SET DEFAULT 'COMPLETADA';

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "discountType" "DiscountType",
ADD COLUMN "discountValue" DECIMAL(12,2),
ADD COLUMN "originalPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SalePayment" ADD COLUMN "cardBrand" TEXT,
ADD COLUMN "cardVoucher" TEXT,
ADD COLUMN "installments" INTEGER,
ADD COLUMN "referenceCode" TEXT;

-- CreateTable
CREATE TABLE "CashShift" (
    "id" TEXT NOT NULL,
    "terminalId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "CashShiftStatus" NOT NULL DEFAULT 'ABIERTA',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "initialAmount" DECIMAL(12,2) NOT NULL,
    "expectedCash" DECIMAL(12,2),
    "expectedDebit" DECIMAL(12,2),
    "expectedCredit" DECIMAL(12,2),
    "expectedTransfer" DECIMAL(12,2),
    "expectedQr" DECIMAL(12,2),
    "actualCash" DECIMAL(12,2),
    "actualDebit" DECIMAL(12,2),
    "actualCredit" DECIMAL(12,2),
    "actualTransfer" DECIMAL(12,2),
    "actualQr" DECIMAL(12,2),
    "differenceCash" DECIMAL(12,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashMovement" (
    "id" TEXT NOT NULL,
    "cashShiftId" TEXT NOT NULL,
    "type" "CashMovementType" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "performedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sale_offlineId_key" ON "Sale"("offlineId");

-- AddForeignKey
ALTER TABLE "CashShift" ADD CONSTRAINT "CashShift_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashMovement" ADD CONSTRAINT "CashMovement_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "CashShift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashierId_fkey" FOREIGN KEY ("cashierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashShiftId_fkey" FOREIGN KEY ("cashShiftId") REFERENCES "CashShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;
