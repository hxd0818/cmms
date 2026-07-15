-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('SINGLE', 'DOUBLE', 'SUITE');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'OCCUPIED', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "LodgingStatus" AS ENUM ('UNASSIGNED', 'RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'ROOM_CHANGED', 'CANCELED');

-- CreateEnum
CREATE TYPE "TableType" AS ENUM ('ROUND', 'SQUARE', 'BUFFET');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('WELCOME_BANQUET', 'FAREWELL', 'LUNCH', 'DINNER', 'BREAKFAST');

-- CreateEnum
CREATE TYPE "CateringStatus" AS ENUM ('SCHEDULED', 'SEATED', 'FINISHED', 'CANCELED');

-- CreateEnum
CREATE TYPE "GiftStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELED');

-- CreateEnum
CREATE TYPE "FeeCategory" AS ENUM ('TRANSPORT', 'LODGING', 'MEAL', 'GIFT', 'OTHER');

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_rooms" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "roomNumber" TEXT NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "hotel_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lodging_orders" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "hotelRoomId" TEXT,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3) NOT NULL,
    "specialRequests" TEXT,
    "status" "LodgingStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "roommateIds" TEXT[],
    "actualCheckInAt" TIMESTAMP(3),
    "actualCheckOutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lodging_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dining_tables" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "type" "TableType" NOT NULL,

    CONSTRAINT "dining_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catering_orders" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "mealType" "MealType" NOT NULL,
    "mealTime" TIMESTAMP(3) NOT NULL,
    "diningTableId" TEXT,
    "specialDietary" TEXT[],
    "status" "CateringStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catering_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2),

    CONSTRAINT "gifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift_orders" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "GiftStatus" NOT NULL DEFAULT 'PENDING',
    "deliveredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gift_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "languages" TEXT[],
    "role" TEXT NOT NULL,

    CONSTRAINT "companions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companion_assignments" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "companionId" TEXT NOT NULL,
    "assignmentScope" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companion_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_records" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT,
    "category" "FeeCategory" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'CNY',
    "incurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fee_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hotel_rooms_hotelId_roomNumber_key" ON "hotel_rooms"("hotelId", "roomNumber");

-- CreateIndex
CREATE INDEX "lodging_orders_meetingId_checkInAt_idx" ON "lodging_orders"("meetingId", "checkInAt");

-- CreateIndex
CREATE INDEX "lodging_orders_hotelRoomId_checkInAt_idx" ON "lodging_orders"("hotelRoomId", "checkInAt");

-- CreateIndex
CREATE INDEX "catering_orders_meetingId_mealTime_idx" ON "catering_orders"("meetingId", "mealTime");

-- CreateIndex
CREATE UNIQUE INDEX "companion_assignments_meetingGuestId_companionId_assignment_key" ON "companion_assignments"("meetingGuestId", "companionId", "assignmentScope");

-- CreateIndex
CREATE INDEX "fee_records_meetingId_category_idx" ON "fee_records"("meetingId", "category");

-- AddForeignKey
ALTER TABLE "hotel_rooms" ADD CONSTRAINT "hotel_rooms_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lodging_orders" ADD CONSTRAINT "lodging_orders_meetingGuestId_fkey" FOREIGN KEY ("meetingGuestId") REFERENCES "meeting_guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lodging_orders" ADD CONSTRAINT "lodging_orders_hotelRoomId_fkey" FOREIGN KEY ("hotelRoomId") REFERENCES "hotel_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catering_orders" ADD CONSTRAINT "catering_orders_meetingGuestId_fkey" FOREIGN KEY ("meetingGuestId") REFERENCES "meeting_guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "catering_orders" ADD CONSTRAINT "catering_orders_diningTableId_fkey" FOREIGN KEY ("diningTableId") REFERENCES "dining_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_orders" ADD CONSTRAINT "gift_orders_meetingGuestId_fkey" FOREIGN KEY ("meetingGuestId") REFERENCES "meeting_guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift_orders" ADD CONSTRAINT "gift_orders_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "gifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companion_assignments" ADD CONSTRAINT "companion_assignments_companionId_fkey" FOREIGN KEY ("companionId") REFERENCES "companions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
