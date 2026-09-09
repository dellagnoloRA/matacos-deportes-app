/*
  Warnings:

  - You are about to drop the column `discipline` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stockLocal` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `stockWeb` on the `ProductVariant` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Brand` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `Brand` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disciplineId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "location" TEXT;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "discipline",
ADD COLUMN     "disciplineId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "stockLocal",
DROP COLUMN "stockWeb",
ADD COLUMN     "minStoreStock" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "stockReserved" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockStore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockWarehouse" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_name_key" ON "Discipline"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Discipline_slug_key" ON "Discipline"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_disciplineId_fkey" FOREIGN KEY ("disciplineId") REFERENCES "Discipline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
