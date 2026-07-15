-- CreateEnum
CREATE TYPE "AgendaType" AS ENUM ('KEYNOTE', 'PANEL', 'BREAK', 'MEAL', 'TOUR', 'OTHER');

-- CreateTable
CREATE TABLE "agenda_items" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AgendaType" NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "venue" TEXT,
    "speakerIds" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agenda_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agenda_items_meetingId_startAt_idx" ON "agenda_items"("meetingId", "startAt");

-- AddForeignKey
ALTER TABLE "agenda_items" ADD CONSTRAINT "agenda_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
