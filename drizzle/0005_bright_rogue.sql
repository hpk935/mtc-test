ALTER TABLE "products" ADD COLUMN "lead_time" varchar(50);--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "alternate_item_number";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "icard";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "bag_type";