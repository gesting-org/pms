-- AlterTable: add deletedAt to Owner
ALTER TABLE "Owner" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Property
ALTER TABLE "Property" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- AlterTable: add deletedAt to Guest
ALTER TABLE "Guest" ADD COLUMN "deletedAt" TIMESTAMP(3);
