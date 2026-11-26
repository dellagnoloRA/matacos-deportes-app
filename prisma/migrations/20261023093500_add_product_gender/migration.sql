-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('HOMBRE', 'MUJER', 'NINO', 'UNISEX');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "gender" "Gender" NOT NULL DEFAULT 'UNISEX';
