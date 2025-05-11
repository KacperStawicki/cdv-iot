/*
  Warnings:

  - Added the required column `authKey` to the `devices` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "devices" DROP CONSTRAINT "devices_userId_fkey";

-- AlterTable
ALTER TABLE "devices" ADD COLUMN     "authKey" TEXT NOT NULL,
ADD COLUMN     "claimed" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "userId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "devices" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
