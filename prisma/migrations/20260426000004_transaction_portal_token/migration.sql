-- Add portalToken to Transaction (backfill existing rows before adding NOT NULL constraint)
ALTER TABLE "Transaction" ADD COLUMN "portalToken" TEXT;
UPDATE "Transaction" SET "portalToken" = gen_random_uuid()::TEXT WHERE "portalToken" IS NULL;
ALTER TABLE "Transaction" ALTER COLUMN "portalToken" SET NOT NULL;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_portalToken_key" UNIQUE ("portalToken");
