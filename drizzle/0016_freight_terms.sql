CREATE TABLE "freight_terms" (
	"code" varchar(50) PRIMARY KEY NOT NULL,
	"description" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Hand-written backfill: the list the order form offered becomes the active
-- freight terms. Any other value already on a record (customer freight terms
-- were free text) is kept as an inactive code so those records still show it.
INSERT INTO "freight_terms" ("code", "description") VALUES
	('03% FREIGHT', '03% FREIGHT'),
	('05% FREIGHT', '05% FREIGHT'),
	('06% FREIGHT', '06% FREIGHT'),
	('07% FREIGHT', '07% FREIGHT'),
	('08% FREIGHT', '08% FREIGHT'),
	('10% FREIGHT', '10% FREIGHT'),
	('15% FREIGHT', '15% FREIGHT'),
	('DELIVER', 'DELIVER'),
	('FREE FREIGHT', 'FREE FREIGHT'),
	('FREIGHT COLLECT', 'FREIGHT COLLECT'),
	('FRT PREPAID', 'FRT PREPAID'),
	('FULL FREIGHT', 'FULL FREIGHT'),
	('PICK UP', 'PICK UP'),
	('SEE COMMENTS', 'SEE COMMENTS');--> statement-breakpoint
INSERT INTO "freight_terms" ("code", "description", "is_active")
SELECT "default_freight_term", "default_freight_term", false FROM "customers" WHERE trim("default_freight_term") <> ''
UNION
SELECT "freight_term", "freight_term", false FROM "orders" WHERE trim("freight_term") <> ''
UNION
SELECT "freight_term", "freight_term", false FROM "invoices" WHERE trim("freight_term") <> ''
ON CONFLICT ("code") DO NOTHING;
