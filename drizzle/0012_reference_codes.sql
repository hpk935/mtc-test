CREATE TABLE "terms" (
	"code" varchar(10) PRIMARY KEY NOT NULL,
	"description" varchar(255) NOT NULL,
	"net_days" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "terms_active_has_net_days" CHECK ("terms"."is_active" = false OR "terms"."net_days" IS NOT NULL),
	CONSTRAINT "terms_net_days_not_negative" CHECK ("terms"."net_days" IS NULL OR "terms"."net_days" >= 0)
);
--> statement-breakpoint
CREATE TABLE "territories" (
	"code" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Hand-written backfill: keep every existing code so the foreign keys below can
-- be added. Blank codes become N/A, matching the legacy import scripts. Existing
-- terms start inactive because their meaning is unconfirmed; territories have no
-- such data to confirm, so they stay selectable with the code as the name.
UPDATE "customers" SET "term_code" = 'N/A' WHERE trim("term_code") = '';--> statement-breakpoint
UPDATE "customers" SET "territory_code" = 'N/A' WHERE trim("territory_code") = '';--> statement-breakpoint
UPDATE "orders" SET "term_code" = 'N/A' WHERE trim("term_code") = '';--> statement-breakpoint
UPDATE "orders" SET "territory_code" = 'N/A' WHERE trim("territory_code") = '';--> statement-breakpoint
UPDATE "invoices" SET "term_code" = 'N/A' WHERE trim("term_code") = '';--> statement-breakpoint
UPDATE "invoices" SET "territory_code" = 'N/A' WHERE trim("territory_code") = '';--> statement-breakpoint
INSERT INTO "terms" ("code", "description", "is_active")
SELECT 'N/A', 'Not specified', false
UNION
SELECT "term_code", "term_code", false FROM "customers" WHERE "term_code" <> 'N/A'
UNION
SELECT "term_code", "term_code", false FROM "orders" WHERE "term_code" <> 'N/A'
UNION
SELECT "term_code", "term_code", false FROM "invoices" WHERE "term_code" <> 'N/A';--> statement-breakpoint
INSERT INTO "territories" ("code", "name")
SELECT 'N/A', 'Not specified'
UNION
SELECT "territory_code", "territory_code" FROM "customers" WHERE "territory_code" <> 'N/A'
UNION
SELECT "territory_code", "territory_code" FROM "orders" WHERE "territory_code" <> 'N/A'
UNION
SELECT "territory_code", "territory_code" FROM "invoices" WHERE "territory_code" <> 'N/A';--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_term_code_terms_code_fk" FOREIGN KEY ("term_code") REFERENCES "public"."terms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_territory_code_territories_code_fk" FOREIGN KEY ("territory_code") REFERENCES "public"."territories"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_term_code_terms_code_fk" FOREIGN KEY ("term_code") REFERENCES "public"."terms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_territory_code_territories_code_fk" FOREIGN KEY ("territory_code") REFERENCES "public"."territories"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_term_code_terms_code_fk" FOREIGN KEY ("term_code") REFERENCES "public"."terms"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_territory_code_territories_code_fk" FOREIGN KEY ("territory_code") REFERENCES "public"."territories"("code") ON DELETE no action ON UPDATE no action;