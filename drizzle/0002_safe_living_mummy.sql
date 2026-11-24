ALTER TABLE "products" ADD CONSTRAINT "products_workshop_id_id_unique" UNIQUE("workshop_id","id");--> statement-breakpoint
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_workshop_id_id_unique" UNIQUE("workshop_id","id");--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_workshop_fk" FOREIGN KEY ("workshop_id","product_id") REFERENCES "public"."products"("workshop_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_location_workshop_fk" FOREIGN KEY ("workshop_id","stock_location_id") REFERENCES "public"."stock_locations"("workshop_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_product_workshop_fk" FOREIGN KEY ("workshop_id","product_id") REFERENCES "public"."products"("workshop_id","id") ON DELETE no action ON UPDATE no action;
