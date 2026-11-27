ALTER TABLE "invoices" ADD COLUMN "credit_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "applied_to_invoice_number" varchar(20);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "credit_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_applied_to_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("applied_to_invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;