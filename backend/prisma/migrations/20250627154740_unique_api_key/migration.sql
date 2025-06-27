/*
  Warnings:

  - A unique constraint covering the columns `[authKey]` on the table `devices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "devices_authKey_key" ON "devices"("authKey");
