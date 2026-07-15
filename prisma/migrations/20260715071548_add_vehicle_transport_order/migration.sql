-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'MPV', 'BUS', 'OTHER');

-- CreateEnum
CREATE TYPE "PickupType" AS ENUM ('AIRPORT', 'TRAINSTATION', 'HOTEL', 'VENUE');

-- CreateEnum
CREATE TYPE "TransportStatus" AS ENUM ('UNASSIGNED', 'ASSIGNED', 'EN_ROUTE', 'PICKED_UP', 'COMPLETED', 'REASSIGNED', 'CANCELED');

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "plateNo" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverPhone" TEXT NOT NULL,
    "belongs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transport_orders" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "pickupType" "PickupType" NOT NULL,
    "pickupLocation" TEXT NOT NULL,
    "pickupTime" TIMESTAMP(3) NOT NULL,
    "dropoffLocation" TEXT NOT NULL,
    "flightNo" TEXT,
    "status" "TransportStatus" NOT NULL DEFAULT 'UNASSIGNED',
    "actualPickupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transport_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plateNo_key" ON "vehicles"("plateNo");

-- CreateIndex
CREATE INDEX "transport_orders_meetingId_pickupTime_idx" ON "transport_orders"("meetingId", "pickupTime");

-- CreateIndex
CREATE INDEX "transport_orders_vehicleId_pickupTime_idx" ON "transport_orders"("vehicleId", "pickupTime");

-- AddForeignKey
ALTER TABLE "transport_orders" ADD CONSTRAINT "transport_orders_meetingGuestId_fkey" FOREIGN KEY ("meetingGuestId") REFERENCES "meeting_guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transport_orders" ADD CONSTRAINT "transport_orders_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
