-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AgendaType" ADD VALUE 'CLOSED_MEETING';
ALTER TYPE "AgendaType" ADD VALUE 'RESEARCH';
ALTER TYPE "AgendaType" ADD VALUE 'SALON';
ALTER TYPE "AgendaType" ADD VALUE 'REVIEW';
ALTER TYPE "AgendaType" ADD VALUE 'ROADSHOW';
ALTER TYPE "AgendaType" ADD VALUE 'DEFENSE';
