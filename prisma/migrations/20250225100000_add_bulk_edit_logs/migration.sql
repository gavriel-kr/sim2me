-- CreateTable
CREATE TABLE "bulk_edit_logs" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "affectedCount" INTEGER NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "rollbackSnapshotJson" TEXT NOT NULL,

    CONSTRAINT "bulk_edit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bulk_edit_logs" ADD CONSTRAINT "bulk_edit_logs_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
