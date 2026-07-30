-- Ticket 024: homepage hot deals (additive — applied via prisma db push on 2026-07-29)
-- CreateTable
CREATE TABLE "hot_deals" (
    "id" TEXT NOT NULL,
    "packageCode" TEXT NOT NULL,
    "dealDay" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "dealPrice" DECIMAL(10,2) NOT NULL,
    "netProfit" DECIMAL(10,2) NOT NULL,
    "locationCode" TEXT NOT NULL,
    "packageName" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hot_deals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hot_deals_dealDay_idx" ON "hot_deals"("dealDay");

-- CreateIndex
CREATE UNIQUE INDEX "hot_deals_packageCode_dealDay_key" ON "hot_deals"("packageCode", "dealDay");
