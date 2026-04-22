CREATE TABLE "invoice_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_number" varchar(20) NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"item_number" varchar(50) NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"qty_ordered" integer DEFAULT 0 NOT NULL,
	"qty_shipped" integer DEFAULT 0 NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"posted" integer DEFAULT 0 NOT NULL,
	"processed" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"legacy_index" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_order_number_orders_order_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("order_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_item_number_products_item_number_fk" FOREIGN KEY ("item_number") REFERENCES "public"."products"("item_number") ON DELETE no action ON UPDATE no action;