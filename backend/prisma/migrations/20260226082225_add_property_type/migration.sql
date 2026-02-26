-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('PG', 'OFFICE', 'HOUSE', 'SHOP');

-- DropForeignKey
ALTER TABLE "TenantAssignment" DROP CONSTRAINT "TenantAssignment_bedId_fkey";

-- AlterTable
ALTER TABLE "Building" ADD COLUMN     "type" "PropertyType" NOT NULL DEFAULT 'PG';

-- AlterTable
ALTER TABLE "TenantAssignment" ADD COLUMN     "assignedBuildingId" TEXT,
ADD COLUMN     "roomId" TEXT,
ALTER COLUMN "bedId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "TenantAssignment" ADD CONSTRAINT "TenantAssignment_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "Bed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantAssignment" ADD CONSTRAINT "TenantAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantAssignment" ADD CONSTRAINT "TenantAssignment_assignedBuildingId_fkey" FOREIGN KEY ("assignedBuildingId") REFERENCES "Building"("id") ON DELETE SET NULL ON UPDATE CASCADE;
