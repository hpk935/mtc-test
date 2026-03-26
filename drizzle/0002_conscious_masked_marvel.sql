CREATE TYPE "public"."account_status" AS ENUM('active', 'inactive', 'on_hold');--> statement-breakpoint
CREATE TYPE "public"."location_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('open', 'posted', 'paid', 'voided');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('open', 'paid', 'partially_paid', 'voided');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('open', 'invoiced', 'voided');--> statement-breakpoint
CREATE TABLE "customers" (
	"customer_number" varchar(20) PRIMARY KEY NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"primary_contact_name" varchar(255) NOT NULL,
	"billing_address_1" varchar(255) NOT NULL,
	"billing_address_2" varchar(255),
	"billing_city" varchar(100) NOT NULL,
	"billing_state_code" varchar(10) NOT NULL,
	"billing_postal_code" varchar(20) NOT NULL,
	"country_code" varchar(5) DEFAULT 'US' NOT NULL,
	"main_phone" varchar(20) NOT NULL,
	"phone_extension" varchar(10),
	"fax_number" varchar(20),
	"main_email" varchar(255) NOT NULL,
	"tax_id" varchar(20),
	"term_code" varchar(10) NOT NULL,
	"territory_code" varchar(20) NOT NULL,
	"salesperson_code" varchar(10) NOT NULL,
	"default_freight_term" varchar(50) NOT NULL,
	"credit_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"account_status" "account_status" DEFAULT 'active' NOT NULL,
	"account_open_date" date NOT NULL,
	"last_invoice_date" date,
	"customer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ship_to_addresses" (
	"ship_to_id" varchar(20) PRIMARY KEY NOT NULL,
	"customer_number" varchar(20) NOT NULL,
	"location_name" varchar(255) NOT NULL,
	"location_status" "location_status" DEFAULT 'active' NOT NULL,
	"address_1" varchar(255) NOT NULL,
	"address_2" varchar(255),
	"city" varchar(100) NOT NULL,
	"state_code" varchar(10) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country_code" varchar(5) DEFAULT 'US' NOT NULL,
	"contact_name" varchar(255),
	"main_phone" varchar(20),
	"is_default" boolean DEFAULT false NOT NULL,
	"customer_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account_receivables" (
	"invoice_number" varchar(20) PRIMARY KEY NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_number" varchar(20) NOT NULL,
	"receivable_date" date NOT NULL,
	"due_date" date NOT NULL,
	"term_code" varchar(10) NOT NULL,
	"invoice_total_amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0' NOT NULL,
	"balance_due" numeric(10, 2) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'open' NOT NULL,
	"paid_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"invoice_number" varchar(20) PRIMARY KEY NOT NULL,
	"order_number" varchar(20) NOT NULL,
	"customer_number" varchar(20) NOT NULL,
	"salesperson_code" varchar(10) NOT NULL,
	"invoice_date" date NOT NULL,
	"customer_po_reference" varchar(50),
	"freight_term" varchar(50) NOT NULL,
	"ship_to_id" varchar(20) NOT NULL,
	"ship_to_name" varchar(255) NOT NULL,
	"ship_to_address_1" varchar(255) NOT NULL,
	"ship_to_address_2" varchar(255),
	"ship_to_city" varchar(100) NOT NULL,
	"ship_to_state_code" varchar(10) NOT NULL,
	"ship_to_postal_code" varchar(20) NOT NULL,
	"term_code" varchar(10) NOT NULL,
	"territory_code" varchar(20) NOT NULL,
	"sales_tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"subtotal_amount" numeric(10, 2) NOT NULL,
	"freight_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"cost_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"invoice_status" "invoice_status" DEFAULT 'open' NOT NULL,
	"shipping_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"order_number" varchar(20) PRIMARY KEY NOT NULL,
	"customer_number" varchar(20) NOT NULL,
	"salesperson_code" varchar(10) NOT NULL,
	"order_date" date NOT NULL,
	"customer_po_reference" varchar(50),
	"freight_term" varchar(50) NOT NULL,
	"ship_to_id" varchar(20) NOT NULL,
	"ship_to_name" varchar(255) NOT NULL,
	"ship_to_address_1" varchar(255) NOT NULL,
	"ship_to_address_2" varchar(255),
	"ship_to_city" varchar(100) NOT NULL,
	"ship_to_state_code" varchar(10) NOT NULL,
	"ship_to_postal_code" varchar(20) NOT NULL,
	"term_code" varchar(10) NOT NULL,
	"territory_code" varchar(20) NOT NULL,
	"sales_tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"subtotal_amount" numeric(10, 2) NOT NULL,
	"freight_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"cost_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"order_status" "order_status" DEFAULT 'open' NOT NULL,
	"shipping_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_salesperson_code_users_employee_id_fk" FOREIGN KEY ("salesperson_code") REFERENCES "public"."users"("employee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship_to_addresses" ADD CONSTRAINT "ship_to_addresses_customer_number_customers_customer_number_fk" FOREIGN KEY ("customer_number") REFERENCES "public"."customers"("customer_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_receivables" ADD CONSTRAINT "account_receivables_invoice_number_invoices_invoice_number_fk" FOREIGN KEY ("invoice_number") REFERENCES "public"."invoices"("invoice_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_receivables" ADD CONSTRAINT "account_receivables_order_number_orders_order_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("order_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_receivables" ADD CONSTRAINT "account_receivables_customer_number_customers_customer_number_fk" FOREIGN KEY ("customer_number") REFERENCES "public"."customers"("customer_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_number_orders_order_number_fk" FOREIGN KEY ("order_number") REFERENCES "public"."orders"("order_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_number_customers_customer_number_fk" FOREIGN KEY ("customer_number") REFERENCES "public"."customers"("customer_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesperson_code_users_employee_id_fk" FOREIGN KEY ("salesperson_code") REFERENCES "public"."users"("employee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ship_to_id_ship_to_addresses_ship_to_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("ship_to_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_number_customers_customer_number_fk" FOREIGN KEY ("customer_number") REFERENCES "public"."customers"("customer_number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_salesperson_code_users_employee_id_fk" FOREIGN KEY ("salesperson_code") REFERENCES "public"."users"("employee_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ship_to_id_ship_to_addresses_ship_to_id_fk" FOREIGN KEY ("ship_to_id") REFERENCES "public"."ship_to_addresses"("ship_to_id") ON DELETE no action ON UPDATE no action;