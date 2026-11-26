-- Order numbers are used to resolve courier webhooks and must be globally
-- unique. De-duplicate any existing collisions before adding the constraint.
WITH duplicates AS (
    SELECT
        id,
        "orderNumber",
        ROW_NUMBER() OVER (PARTITION BY "orderNumber" ORDER BY "createdAt", id) AS rn
    FROM "orders"
)
UPDATE "orders" AS o
SET "orderNumber" = o."orderNumber" || '-' || substr(md5(o.id || random()::text), 1, 6)
FROM duplicates AS d
WHERE o.id = d.id AND d.rn > 1;

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- Idempotency key for courier webhook events (prevents duplicate events on retries).
ALTER TABLE "shipment_events" ADD COLUMN "dedupeKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "shipment_events_dedupeKey_key" ON "shipment_events"("dedupeKey");
