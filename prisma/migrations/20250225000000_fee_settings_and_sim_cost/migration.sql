-- AlterTable
ALTER TABLE "package_overrides" ADD COLUMN "simCost" DECIMAL(10,4);

-- CreateEnum
CREATE TYPE "AdditionalFeeType" AS ENUM ('FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "AdditionalFeeAppliesTo" AS ENUM ('ALL_PRODUCTS', 'SELECTED_PRODUCTS');

-- CreateTable
CREATE TABLE "fee_settings" (
    "id" TEXT NOT NULL,
    "paddlePercentageFee" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "paddleFixedFee" DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "additional_fees" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AdditionalFeeType" NOT NULL,
    "value" DECIMAL(10,4) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "appliesTo" "AdditionalFeeAppliesTo" NOT NULL DEFAULT 'ALL_PRODUCTS',
    "selectedProductIds" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "additional_fees_pkey" PRIMARY KEY ("id")
);
