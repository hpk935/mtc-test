CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_date" date NOT NULL,
	"payment_ref" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_receivables" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "account_receivables" CASCADE;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DEFAULT 'open'::text;--> statement-breakpoint
DROP TYPE "public"."invoice_status";--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('open', 'paid', 'partially_paid', 'voided');--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DEFAULT 'open'::"public"."invoice_status";--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "invoice_status" SET DATA TYPE "public"."invoice_status" USING "invoice_status"::"public"."invoice_status";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "balance_due" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "paid_date" date;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "payment_ref" varchar(50);--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "item_cost_hk";--> statement-breakpoint
DROP TYPE "public"."payment_status";