CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"invoice_number" varchar(20),
	"item_number" varchar(50) NOT NULL,
	"unit_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"qty_ordered" integer DEFAULT 0 NOT NULL,
	"qty_shipped" integer DEFAULT 0 NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"unit_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"line_total" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"product_id" integer PRIMARY KEY NOT NULL,
	"item_number" varchar(50) NOT NULL,
	"description" varchar(500) NOT NULL,
	"carton_number" varchar(50),
	"unit_sold_by" varchar(10) NOT NULL,
	"min_qty" integer DEFAULT 0 NOT NULL,
	"max_qty" integer DEFAULT 0 NOT NULL,
	"product_type" varchar(10) NOT NULL,
	"dimensions_l" numeric(10, 2) DEFAULT '0' NOT NULL,
	"dimensions_w" numeric(10, 2) DEFAULT '0' NOT NULL,
	"dimensions_h" numeric(10, 2) DEFAULT '0' NOT NULL,
	"cubic_feet" numeric(10, 4) DEFAULT '0' NOT NULL,
	"case_weight" numeric(10, 2) DEFAULT '0' NOT NULL,
	"upc_number" varchar(50),
	"landed_cost" numeric(10, 2) DEFAULT '0' NOT NULL,
	"minimum_pack_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"case_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"item_cost_hk" numeric(10, 2) DEFAULT '0' NOT NULL,
	"qty_in_stock" integer DEFAULT 0 NOT NULL,
	"qty_committed" integer DEFAULT 0 NOT NULL,
	"qty_available" integer DEFAULT 0 NOT NULL,
	"qty_on_order" integer DEFAULT 0 NOT NULL,
	"upcoming_shipment_no" varchar(20),
	"upcoming_shipment_arrival" date,
	"upcoming_shipment_qty" integer,
	"nob" integer,
	"alternate_item_number" varchar(50),
	"is_discontinued" boolean DEFAULT false NOT NULL,
	"icard" varchar(50),
	"bag_type" varchar(50),
	"hts_code" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_item_number_unique" UNIQUE("item_number")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_number_orders_order_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("order_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_item_number_products_item_number_fk" FOREIGN KEY ("item_number") REFERENCES "public"."products"("item_number") ON DELETE no action ON UPDATE no action;