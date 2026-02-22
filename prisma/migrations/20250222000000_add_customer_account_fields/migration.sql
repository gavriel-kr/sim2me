-- AlterTable
ALTER TABLE "customers" ADD COLUMN "password" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "phone" TEXT,
ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "emailVerifyToken" TEXT,
ADD COLUMN "emailVerifyExpires" TIMESTAMP(3),
ADD COLUMN "newsletter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resetToken" TEXT,
ADD COLUMN "resetExpires" TIMESTAMP(3),
ADD COLUMN "pendingEmail" TEXT,
ADD COLUMN "pendingEmailToken" TEXT,
ADD COLUMN "pendingEmailExpires" TIMESTAMP(3);
