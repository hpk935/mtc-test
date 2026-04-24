CREATE TYPE "public"."purchase_order_status" AS ENUM('draft', 'ordered', 'partially_received', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."vendor_type" AS ENUM('CS', 'CO');--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_order_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"item_number" varchar(50) NOT NULL,
	"description" varchar(500) NOT NULL,
	"qty_ordered" integer NOT NULL,
	"qty_received" integer DEFAULT 0 NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"line_total" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"po_number" varchar(20) NOT NULL,
	"vendor_id" integer NOT NULL,
	"status" "purchase_order_status" DEFAULT 'draft' NOT NULL,
	"order_date" date NOT NULL,
	"expected_date" date,
	"received_date" date,
	"subtotal_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"freight_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" varchar(10),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_orders_po_number_unique" UNIQUE("po_number")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" serial PRIMARY KEY NOT NULL,
	"vendor_code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address_1" varchar(255),
	"address_2" varchar(255),
	"city" varchar(100),
	"state" varchar(10),
	"zip" varchar(20),
	"phone" varchar(20),
	"fax" varchar(20),
	"account_number" varchar(50),
	"contact_name" varchar(100),
	"tax_id" varchar(20),
	"send_1099" boolean DEFAULT false NOT NULL,
	"vendor_type" "vendor_type" DEFAULT 'CS' NOT NULL,
	"payment_terms" varchar(10),
	"gl_account_code" varchar(10),
	"date_added" date,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_vendor_code_unique" UNIQUE("vendor_code")
);
--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_product_id_products_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("product_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_employee_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("employee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "upcoming_shipment_no";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "upcoming_shipment_arrival";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "upcoming_shipment_qty";