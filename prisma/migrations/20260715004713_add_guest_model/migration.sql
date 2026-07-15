-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "GuestLevel" AS ENUM ('VIP_A', 'VIP_B', 'A', 'B', 'C');

-- CreateTable
CREATE TABLE "guests" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" "Gender",
    "phone" TEXT,
    "email" TEXT,
    "company" TEXT,
    "title" TEXT,
    "level" "GuestLevel" NOT NULL DEFAULT 'C',
    "avatarUrl" TEXT,
    "idNumber" TEXT,
    "dietaryTags" TEXT[],
    "notes" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guests_phone_key" ON "guests"("phone");

-- CreateIndex
CREATE INDEX "guests_name_idx" ON "guests"("name");

-- CreateIndex
CREATE INDEX "guests_company_idx" ON "guests"("company");
