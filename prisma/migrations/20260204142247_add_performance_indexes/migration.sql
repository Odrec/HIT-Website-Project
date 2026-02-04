-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "events"("createdAt");

-- CreateIndex
CREATE INDEX "events_institution_eventType_idx" ON "events"("institution", "eventType");

-- CreateIndex
CREATE INDEX "events_timeStart_timeEnd_idx" ON "events"("timeStart", "timeEnd");

-- CreateIndex
CREATE INDEX "events_institution_timeStart_idx" ON "events"("institution", "timeStart");
