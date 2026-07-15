-- CreateTable
CREATE TABLE "guest_access_tokens" (
    "id" TEXT NOT NULL,
    "meetingGuestId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedBy" TEXT,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "guest_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "driver_access_tokens" (
    "id" TEXT NOT NULL,
    "transportOrderId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "driver_access_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_access_tokens_meetingGuestId_key" ON "guest_access_tokens"("meetingGuestId");

-- CreateIndex
CREATE UNIQUE INDEX "guest_access_tokens_tokenHash_key" ON "guest_access_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "guest_access_tokens_expiresAt_idx" ON "guest_access_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "driver_access_tokens_transportOrderId_key" ON "driver_access_tokens"("transportOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "driver_access_tokens_tokenHash_key" ON "driver_access_tokens"("tokenHash");
