-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'PLANNING', 'ONGOING', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('PENDING', 'CONFIRMED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ReceptionStage" AS ENUM ('NOT_ARRIVED', 'CHECKED_IN', 'IN_HOUSE', 'DEPARTED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "EntourageRole" AS ENUM ('PRIMARY', 'SECRETARY', 'SECURITY', 'INTERPRETER', 'FAMILY', 'AIDE', 'DRIVER');

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_guests" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "rsvpStatus" "RsvpStatus" NOT NULL DEFAULT 'PENDING',
    "groupTags" TEXT[],
    "receptionStage" "ReceptionStage" NOT NULL DEFAULT 'NOT_ARRIVED',
    "primaryMeetingGuestId" TEXT,
    "entourageRole" "EntourageRole",
    "levelOverride" "GuestLevel",
    "inheritLodging" BOOLEAN NOT NULL DEFAULT true,
    "inheritTransport" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_guests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meetings_code_key" ON "meetings"("code");

-- CreateIndex
CREATE INDEX "meetings_status_startAt_idx" ON "meetings"("status", "startAt");

-- CreateIndex
CREATE INDEX "meeting_guests_meetingId_receptionStage_idx" ON "meeting_guests"("meetingId", "receptionStage");

-- CreateIndex
CREATE INDEX "meeting_guests_guestId_idx" ON "meeting_guests"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_guests_meetingId_guestId_key" ON "meeting_guests"("meetingId", "guestId");

-- AddForeignKey
ALTER TABLE "meeting_guests" ADD CONSTRAINT "meeting_guests_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_guests" ADD CONSTRAINT "meeting_guests_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_guests" ADD CONSTRAINT "meeting_guests_primaryMeetingGuestId_fkey" FOREIGN KEY ("primaryMeetingGuestId") REFERENCES "meeting_guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
