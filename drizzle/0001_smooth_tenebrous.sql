ALTER TABLE "payment_allocations" DROP CONSTRAINT "payment_allocations_one_document_check";--> statement-breakpoint
ALTER TABLE "inventory_balances" ALTER COLUMN "average_unit_cost" SET DATA TYPE numeric(18, 6);--> statement-breakpoint
ALTER TABLE "inventory_balances" ALTER COLUMN "average_unit_cost" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "inventory_movements" ALTER COLUMN "unit_cost_applied" SET DATA TYPE numeric(18, 6);--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD COLUMN "workshop_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD COLUMN "reverses_movement_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD COLUMN "purchase_line_id" uuid;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD COLUMN "repair_expense_id" uuid;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD COLUMN "workshop_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD COLUMN "organization_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD COLUMN "workshop_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD COLUMN "purchase_line_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_workshop_tenant_fk" FOREIGN KEY ("organization_id","workshop_id") REFERENCES "public"."workshops"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_tenant_fk" FOREIGN KEY ("organization_id","product_id") REFERENCES "public"."products"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_reversal_fk" FOREIGN KEY ("reverses_movement_id") REFERENCES "public"."inventory_movements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_purchase_line_fk" FOREIGN KEY ("purchase_line_id") REFERENCES "public"."purchase_lines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_repair_expense_fk" FOREIGN KEY ("repair_expense_id") REFERENCES "public"."repair_expenses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reversal_same_tenant_fk" FOREIGN KEY ("organization_id","reversed_payment_id") REFERENCES "public"."payments"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_workshop_tenant_fk" FOREIGN KEY ("organization_id","workshop_id") REFERENCES "public"."workshops"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_purchase_tenant_fk" FOREIGN KEY ("organization_id","purchase_id") REFERENCES "public"."purchases"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_repair_tenant_fk" FOREIGN KEY ("organization_id","repair_order_id") REFERENCES "public"."repair_orders"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD CONSTRAINT "repair_expenses_workshop_tenant_fk" FOREIGN KEY ("organization_id","workshop_id") REFERENCES "public"."workshops"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD CONSTRAINT "repair_expenses_repair_tenant_fk" FOREIGN KEY ("organization_id","repair_order_id") REFERENCES "public"."repair_orders"("organization_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_movements_single_reversal_unique" ON "inventory_movements" USING btree ("reverses_movement_id") WHERE "inventory_movements"."reverses_movement_id" is not null;--> statement-breakpoint
CREATE INDEX "payment_allocations_purchase_line_id_idx" ON "payment_allocations" USING btree ("purchase_line_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_repair_expense_id_idx" ON "payment_allocations" USING btree ("repair_expense_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_single_reversal_unique" ON "payments" USING btree ("reversed_payment_id") WHERE "payments"."reversed_payment_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "repair_expenses_purchase_line_unique" ON "repair_expenses" USING btree ("purchase_line_id") WHERE "repair_expenses"."purchase_line_id" is not null;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_organization_id_id_unique" UNIQUE("organization_id","id");--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_one_document_check" CHECK ((case when "payment_allocations"."repair_order_id" is not null then 1 else 0 end + case when "payment_allocations"."sale_id" is not null then 1 else 0 end + case when "payment_allocations"."purchase_id" is not null then 1 else 0 end + case when "payment_allocations"."operating_expense_id" is not null then 1 else 0 end + case when "payment_allocations"."purchase_line_id" is not null then 1 else 0 end + case when "payment_allocations"."repair_expense_id" is not null then 1 else 0 end) = 1);
