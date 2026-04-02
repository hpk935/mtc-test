ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DATA TYPE text;--> statement-breakpoint
UPDATE "invoices" SET "invoice_status" = 'posted' WHERE "invoice_status" = 'open';--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DEFAULT 'posted'::text;--> statement-breakpoint
DROP TYPE "public"."invoice_status";--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('posted', 'paid', 'voided');--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DEFAULT 'posted'::"public"."invoice_status";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DATA TYPE "public"."invoice_status" USING "invoice_status"::"public"."invoice_status";