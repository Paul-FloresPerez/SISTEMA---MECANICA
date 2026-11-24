CREATE TYPE "public"."document_type" AS ENUM('repair', 'sale', 'purchase', 'sale_return', 'purchase_return');--> statement-breakpoint
CREATE TYPE "public"."expense_status" AS ENUM('pending', 'partially_paid', 'paid', 'voided', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."inventory_movement_type" AS ENUM('purchase_receipt', 'repair_consumption', 'sale', 'sale_return', 'purchase_return', 'adjustment_in', 'adjustment_out', 'void_reversal');--> statement-breakpoint
CREATE TYPE "public"."payment_direction" AS ENUM('inbound', 'outbound');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'yape', 'plin', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'confirmed', 'voided', 'reversed');--> statement-breakpoint
CREATE TYPE "public"."purchase_line_destination" AS ENUM('inventory', 'repair_direct');--> statement-breakpoint
CREATE TYPE "public"."purchase_status" AS ENUM('draft', 'ordered', 'received', 'cancelled', 'voided');--> statement-breakpoint
CREATE TYPE "public"."repair_part_source" AS ENUM('inventory', 'direct_purchase', 'customer');--> statement-breakpoint
CREATE TYPE "public"."repair_status" AS ENUM('received', 'diagnosis', 'in_progress', 'waiting_parts', 'ready', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."return_status" AS ENUM('draft', 'completed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('draft', 'completed', 'voided');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'workshop_manager', 'mechanic', 'cashier');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid,
	"actor_user_id" uuid,
	"action" varchar(120) NOT NULL,
	"entity_type" varchar(120) NOT NULL,
	"entity_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"phone" varchar(32),
	"email" varchar(320),
	"document_type" varchar(16),
	"document_number" varchar(32),
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_organization_id_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "document_sequences" (
	"workshop_id" uuid NOT NULL,
	"document_type" "document_type" NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_sequences_pkey" PRIMARY KEY("workshop_id","document_type","year"),
	CONSTRAINT "document_sequences_year_check" CHECK ("document_sequences"."year" between 2000 and 9999),
	CONSTRAINT "document_sequences_last_value_check" CHECK ("document_sequences"."last_value" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_balances" (
	"product_id" uuid NOT NULL,
	"stock_location_id" uuid NOT NULL,
	"quantity_on_hand" numeric(14, 3) DEFAULT '0' NOT NULL,
	"inventory_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"average_unit_cost" numeric(14, 2) DEFAULT '0' NOT NULL,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_balances_pkey" PRIMARY KEY("product_id","stock_location_id"),
	CONSTRAINT "inventory_balances_quantity_check" CHECK ("inventory_balances"."quantity_on_hand" >= 0),
	CONSTRAINT "inventory_balances_value_check" CHECK ("inventory_balances"."inventory_value" >= 0),
	CONSTRAINT "inventory_balances_average_cost_check" CHECK ("inventory_balances"."average_unit_cost" >= 0),
	CONSTRAINT "inventory_balances_version_check" CHECK ("inventory_balances"."version" >= 0)
);
--> statement-breakpoint
CREATE TABLE "inventory_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"stock_location_id" uuid NOT NULL,
	"movement_type" "inventory_movement_type" NOT NULL,
	"quantity_delta" numeric(14, 3) NOT NULL,
	"unit_cost_applied" numeric(14, 2) NOT NULL,
	"total_cost_applied" numeric(14, 2) NOT NULL,
	"quantity_before" numeric(14, 3) NOT NULL,
	"quantity_after" numeric(14, 3) NOT NULL,
	"inventory_value_before" numeric(14, 2) NOT NULL,
	"inventory_value_after" numeric(14, 2) NOT NULL,
	"reason" varchar(240) NOT NULL,
	"reference_type" varchar(64) NOT NULL,
	"reference_id" uuid NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_movements_reference_unique" UNIQUE("reference_type","reference_id","product_id","stock_location_id"),
	CONSTRAINT "inventory_movements_costs_check" CHECK ("inventory_movements"."unit_cost_applied" >= 0 and "inventory_movements"."total_cost_applied" >= 0 and "inventory_movements"."inventory_value_before" >= 0 and "inventory_movements"."inventory_value_after" >= 0),
	CONSTRAINT "inventory_movements_balance_check" CHECK ("inventory_movements"."quantity_after" >= 0)
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"workshop_id" uuid,
	"role" "user_role" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "memberships_organization_user_unique" UNIQUE("organization_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "motorcycles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"brand" varchar(80) NOT NULL,
	"model" varchar(120) NOT NULL,
	"year" integer,
	"plate" varchar(16),
	"vin" varchar(32),
	"displacement_cc" integer,
	"color" varchar(48),
	"mileage_km" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "motorcycles_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "motorcycles_mileage_check" CHECK ("motorcycles"."mileage_km" >= 0),
	CONSTRAINT "motorcycles_displacement_check" CHECK ("motorcycles"."displacement_cc" is null or "motorcycles"."displacement_cc" > 0)
);
--> statement-breakpoint
CREATE TABLE "operating_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"category" varchar(120) NOT NULL,
	"payee" varchar(160),
	"description" varchar(240) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"incurred_on" date NOT NULL,
	"cost_center" varchar(120),
	"status" "expense_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "operating_expenses_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "operating_expenses_amount_check" CHECK ("operating_expenses"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"legal_name" varchar(200),
	"tax_id" varchar(32),
	"default_currency" varchar(3) DEFAULT 'PEN' NOT NULL,
	"timezone" varchar(64) DEFAULT 'America/Lima' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"repair_order_id" uuid,
	"sale_id" uuid,
	"purchase_id" uuid,
	"operating_expense_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_allocations_amount_check" CHECK ("payment_allocations"."amount" > 0),
	CONSTRAINT "payment_allocations_one_document_check" CHECK ((case when "payment_allocations"."repair_order_id" is not null then 1 else 0 end + case when "payment_allocations"."sale_id" is not null then 1 else 0 end + case when "payment_allocations"."purchase_id" is not null then 1 else 0 end + case when "payment_allocations"."operating_expense_id" is not null then 1 else 0 end) = 1)
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"code" "payment_method" NOT NULL,
	"label" varchar(80) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"account_reference" varchar(160),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_methods_workshop_code_unique" UNIQUE("workshop_id","code")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"direction" "payment_direction" NOT NULL,
	"method" "payment_method" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"external_reference" varchar(160),
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"note" text,
	"idempotency_key" varchar(100) NOT NULL,
	"reversed_payment_id" uuid,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "payments_workshop_idempotency_key_unique" UNIQUE("workshop_id","idempotency_key"),
	CONSTRAINT "payments_amount_check" CHECK ("payments"."amount" > 0)
);
--> statement-breakpoint
CREATE TABLE "product_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"category_id" uuid,
	"sku" varchar(80) NOT NULL,
	"name" varchar(200) NOT NULL,
	"brand" varchar(120),
	"sale_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"min_stock" numeric(14, 3) DEFAULT '0' NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "products_workshop_sku_unique" UNIQUE("workshop_id","sku"),
	CONSTRAINT "products_sale_price_check" CHECK ("products"."sale_price" >= 0),
	CONSTRAINT "products_min_stock_check" CHECK ("products"."min_stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"product_id" uuid,
	"repair_order_id" uuid,
	"destination" "purchase_line_destination" NOT NULL,
	"description" varchar(240) NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_cost" numeric(14, 2) NOT NULL,
	"inventory_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_lines_quantity_check" CHECK ("purchase_lines"."quantity" > 0),
	CONSTRAINT "purchase_lines_unit_cost_check" CHECK ("purchase_lines"."unit_cost" >= 0),
	CONSTRAINT "purchase_lines_destination_check" CHECK (("purchase_lines"."destination" = 'inventory' and "purchase_lines"."repair_order_id" is null) or ("purchase_lines"."destination" = 'repair_direct' and "purchase_lines"."repair_order_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "purchase_return_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_return_id" uuid NOT NULL,
	"purchase_line_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_cost_snapshot" numeric(14, 2) NOT NULL,
	"inventory_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_return_lines_quantity_check" CHECK ("purchase_return_lines"."quantity" > 0),
	CONSTRAINT "purchase_return_lines_cost_check" CHECK ("purchase_return_lines"."unit_cost_snapshot" >= 0)
);
--> statement-breakpoint
CREATE TABLE "purchase_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"purchase_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"status" "return_status" DEFAULT 'draft' NOT NULL,
	"reason" text NOT NULL,
	"returned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_returns_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "purchase_returns_workshop_code_unique" UNIQUE("workshop_id","code")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"supplier_id" uuid,
	"code" varchar(40) NOT NULL,
	"status" "purchase_status" DEFAULT 'draft' NOT NULL,
	"purchased_on" date NOT NULL,
	"received_at" timestamp with time zone,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "purchases_workshop_code_unique" UNIQUE("workshop_id","code"),
	CONSTRAINT "purchases_amounts_check" CHECK ("purchases"."subtotal" >= 0 and "purchases"."discount" >= 0 and "purchases"."total" >= 0 and "purchases"."total" = "purchases"."subtotal" - "purchases"."discount")
);
--> statement-breakpoint
CREATE TABLE "repair_expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" uuid NOT NULL,
	"description" varchar(240) NOT NULL,
	"category" varchar(120) NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"incurred_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repair_expenses_amount_check" CHECK ("repair_expenses"."amount" >= 0)
);
--> statement-breakpoint
CREATE TABLE "repair_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" uuid NOT NULL,
	"product_id" uuid,
	"source" "repair_part_source" NOT NULL,
	"name_snapshot" varchar(200) NOT NULL,
	"sku_snapshot" varchar(80),
	"quantity" numeric(14, 3) NOT NULL,
	"unit_cost_snapshot" numeric(14, 2) DEFAULT '0' NOT NULL,
	"unit_price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"supplier_name" varchar(160),
	"notes" text,
	"inventory_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repair_lines_quantity_check" CHECK ("repair_lines"."quantity" > 0),
	CONSTRAINT "repair_lines_cost_check" CHECK ("repair_lines"."unit_cost_snapshot" >= 0),
	CONSTRAINT "repair_lines_price_check" CHECK ("repair_lines"."unit_price" >= 0)
);
--> statement-breakpoint
CREATE TABLE "repair_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"customer_id" uuid NOT NULL,
	"motorcycle_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"status" "repair_status" DEFAULT 'received' NOT NULL,
	"customer_name_snapshot" varchar(160) NOT NULL,
	"motorcycle_snapshot" varchar(320) NOT NULL,
	"plate_snapshot" varchar(16),
	"reported_problem" text NOT NULL,
	"diagnosis_notes" text,
	"mechanic_name" varchar(160),
	"mileage_at_entry" integer DEFAULT 0 NOT NULL,
	"quoted_total" numeric(14, 2),
	"estimated_delivery_date" date,
	"delivered_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" uuid,
	"cancellation_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "repair_orders_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "repair_orders_workshop_code_unique" UNIQUE("workshop_id","code"),
	CONSTRAINT "repair_orders_mileage_check" CHECK ("repair_orders"."mileage_at_entry" >= 0),
	CONSTRAINT "repair_orders_quote_check" CHECK ("repair_orders"."quoted_total" is null or "repair_orders"."quoted_total" >= 0)
);
--> statement-breakpoint
CREATE TABLE "repair_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" uuid NOT NULL,
	"previous_status" "repair_status",
	"next_status" "repair_status" NOT NULL,
	"note" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sale_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"product_id" uuid,
	"sku_snapshot" varchar(80),
	"name_snapshot" varchar(200) NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"unit_cost_snapshot" numeric(14, 2) DEFAULT '0' NOT NULL,
	"inventory_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_lines_quantity_check" CHECK ("sale_lines"."quantity" > 0),
	CONSTRAINT "sale_lines_money_check" CHECK ("sale_lines"."unit_price" >= 0 and "sale_lines"."discount" >= 0 and "sale_lines"."unit_cost_snapshot" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sale_return_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_return_id" uuid NOT NULL,
	"sale_line_id" uuid NOT NULL,
	"quantity" numeric(14, 3) NOT NULL,
	"unit_price_snapshot" numeric(14, 2) NOT NULL,
	"unit_cost_snapshot" numeric(14, 2) NOT NULL,
	"inventory_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_return_lines_quantity_check" CHECK ("sale_return_lines"."quantity" > 0),
	CONSTRAINT "sale_return_lines_costs_check" CHECK ("sale_return_lines"."unit_price_snapshot" >= 0 and "sale_return_lines"."unit_cost_snapshot" >= 0)
);
--> statement-breakpoint
CREATE TABLE "sale_returns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"sale_id" uuid NOT NULL,
	"code" varchar(40) NOT NULL,
	"status" "return_status" DEFAULT 'draft' NOT NULL,
	"reason" text NOT NULL,
	"returned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sale_returns_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "sale_returns_workshop_code_unique" UNIQUE("workshop_id","code")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid NOT NULL,
	"customer_id" uuid,
	"code" varchar(40) NOT NULL,
	"status" "sale_status" DEFAULT 'draft' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"discount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"sold_at" timestamp with time zone DEFAULT now() NOT NULL,
	"voided_at" timestamp with time zone,
	"voided_by" uuid,
	"void_reason" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "sales_workshop_code_unique" UNIQUE("workshop_id","code"),
	CONSTRAINT "sales_amounts_check" CHECK ("sales"."subtotal" >= 0 and "sales"."discount" >= 0 and "sales"."total" >= 0 and "sales"."total" = "sales"."subtotal" - "sales"."discount")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"workshop_id" uuid,
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workshop_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_locations_workshop_name_unique" UNIQUE("workshop_id","name")
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"tax_id" varchar(32),
	"contact_name" varchar(160),
	"phone" varchar(32),
	"email" varchar(320),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_organization_id_id_unique" UNIQUE("organization_id","id")
);
--> statement-breakpoint
CREATE TABLE "user_credentials" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"password_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	CONSTRAINT "user_credentials_failed_attempts_check" CHECK ("user_credentials"."failed_attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"email" varchar(320) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workshops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"address" text,
	"phone" varchar(32),
	"email" varchar(320),
	"business_hours" varchar(160),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workshops_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workshops_organization_name_unique" UNIQUE("organization_id","name")
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_sequences" ADD CONSTRAINT "document_sequences_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_balances" ADD CONSTRAINT "inventory_balances_stock_location_id_stock_locations_id_fk" FOREIGN KEY ("stock_location_id") REFERENCES "public"."stock_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_stock_location_id_stock_locations_id_fk" FOREIGN KEY ("stock_location_id") REFERENCES "public"."stock_locations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "motorcycles" ADD CONSTRAINT "motorcycles_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "operating_expenses" ADD CONSTRAINT "operating_expenses_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_operating_expense_id_operating_expenses_id_fk" FOREIGN KEY ("operating_expense_id") REFERENCES "public"."operating_expenses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_lines" ADD CONSTRAINT "purchase_lines_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchase_return_id_purchase_returns_id_fk" FOREIGN KEY ("purchase_return_id") REFERENCES "public"."purchase_returns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_return_lines" ADD CONSTRAINT "purchase_return_lines_purchase_line_id_purchase_lines_id_fk" FOREIGN KEY ("purchase_line_id") REFERENCES "public"."purchase_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_expenses" ADD CONSTRAINT "repair_expenses_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_lines" ADD CONSTRAINT "repair_lines_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_lines" ADD CONSTRAINT "repair_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_motorcycle_id_motorcycles_id_fk" FOREIGN KEY ("motorcycle_id") REFERENCES "public"."motorcycles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_cancelled_by_users_id_fk" FOREIGN KEY ("cancelled_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_status_history" ADD CONSTRAINT "repair_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_lines" ADD CONSTRAINT "sale_lines_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_lines" ADD CONSTRAINT "sale_return_lines_sale_return_id_sale_returns_id_fk" FOREIGN KEY ("sale_return_id") REFERENCES "public"."sale_returns"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_return_lines" ADD CONSTRAINT "sale_return_lines_sale_line_id_sale_lines_id_fk" FOREIGN KEY ("sale_line_id") REFERENCES "public"."sale_lines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_returns" ADD CONSTRAINT "sale_returns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_locations" ADD CONSTRAINT "stock_locations_workshop_id_workshops_id_fk" FOREIGN KEY ("workshop_id") REFERENCES "public"."workshops"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workshops" ADD CONSTRAINT "workshops_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_tenant_created_at_idx" ON "audit_logs" USING btree ("organization_id","workshop_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customers_document_number_unique" ON "customers" USING btree ("organization_id","document_number") WHERE "customers"."document_number" is not null;--> statement-breakpoint
CREATE INDEX "customers_workshop_name_idx" ON "customers" USING btree ("workshop_id","full_name");--> statement-breakpoint
CREATE INDEX "customers_workshop_phone_idx" ON "customers" USING btree ("workshop_id","phone");--> statement-breakpoint
CREATE INDEX "inventory_balances_location_idx" ON "inventory_balances" USING btree ("stock_location_id");--> statement-breakpoint
CREATE INDEX "inventory_movements_product_created_idx" ON "inventory_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_location_created_idx" ON "inventory_movements" USING btree ("stock_location_id","created_at");--> statement-breakpoint
CREATE INDEX "inventory_movements_reference_idx" ON "inventory_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "memberships_user_id_idx" ON "memberships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "memberships_organization_workshop_idx" ON "memberships" USING btree ("organization_id","workshop_id");--> statement-breakpoint
CREATE UNIQUE INDEX "motorcycles_workshop_plate_unique" ON "motorcycles" USING btree ("workshop_id","plate") WHERE "motorcycles"."plate" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "motorcycles_organization_vin_unique" ON "motorcycles" USING btree ("organization_id","vin") WHERE "motorcycles"."vin" is not null;--> statement-breakpoint
CREATE INDEX "motorcycles_customer_id_idx" ON "motorcycles" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "operating_expenses_workshop_status_date_idx" ON "operating_expenses" USING btree ("workshop_id","status","incurred_on");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_tax_id_unique" ON "organizations" USING btree ("tax_id") WHERE "organizations"."tax_id" is not null;--> statement-breakpoint
CREATE INDEX "payment_allocations_payment_id_idx" ON "payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_repair_order_id_idx" ON "payment_allocations" USING btree ("repair_order_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_sale_id_idx" ON "payment_allocations" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_purchase_id_idx" ON "payment_allocations" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "payment_allocations_expense_id_idx" ON "payment_allocations" USING btree ("operating_expense_id");--> statement-breakpoint
CREATE INDEX "payments_workshop_status_paid_at_idx" ON "payments" USING btree ("workshop_id","status","paid_at");--> statement-breakpoint
CREATE INDEX "payments_reversed_payment_id_idx" ON "payments" USING btree ("reversed_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_categories_workshop_name_unique" ON "product_categories" USING btree ("workshop_id",lower("name"));--> statement-breakpoint
CREATE INDEX "products_workshop_active_idx" ON "products" USING btree ("workshop_id","name") WHERE "products"."is_active";--> statement-breakpoint
CREATE INDEX "products_category_id_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "purchase_lines_purchase_id_idx" ON "purchase_lines" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchase_lines_product_id_idx" ON "purchase_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "purchase_lines_repair_order_id_idx" ON "purchase_lines" USING btree ("repair_order_id");--> statement-breakpoint
CREATE INDEX "purchase_return_lines_return_id_idx" ON "purchase_return_lines" USING btree ("purchase_return_id");--> statement-breakpoint
CREATE INDEX "purchase_return_lines_purchase_line_id_idx" ON "purchase_return_lines" USING btree ("purchase_line_id");--> statement-breakpoint
CREATE INDEX "purchase_returns_purchase_id_idx" ON "purchase_returns" USING btree ("purchase_id");--> statement-breakpoint
CREATE INDEX "purchases_workshop_status_date_idx" ON "purchases" USING btree ("workshop_id","status","purchased_on");--> statement-breakpoint
CREATE INDEX "purchases_supplier_id_idx" ON "purchases" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "repair_expenses_repair_order_id_idx" ON "repair_expenses" USING btree ("repair_order_id");--> statement-breakpoint
CREATE INDEX "repair_lines_repair_order_id_idx" ON "repair_lines" USING btree ("repair_order_id");--> statement-breakpoint
CREATE INDEX "repair_lines_product_id_idx" ON "repair_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "repair_orders_workshop_status_created_idx" ON "repair_orders" USING btree ("workshop_id","status","created_at");--> statement-breakpoint
CREATE INDEX "repair_orders_customer_id_idx" ON "repair_orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "repair_orders_motorcycle_id_idx" ON "repair_orders" USING btree ("motorcycle_id");--> statement-breakpoint
CREATE INDEX "repair_status_history_repair_created_idx" ON "repair_status_history" USING btree ("repair_order_id","created_at");--> statement-breakpoint
CREATE INDEX "sale_lines_sale_id_idx" ON "sale_lines" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sale_lines_product_id_idx" ON "sale_lines" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "sale_return_lines_return_id_idx" ON "sale_return_lines" USING btree ("sale_return_id");--> statement-breakpoint
CREATE INDEX "sale_return_lines_sale_line_id_idx" ON "sale_return_lines" USING btree ("sale_line_id");--> statement-breakpoint
CREATE INDEX "sale_returns_sale_id_idx" ON "sale_returns" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sales_workshop_status_sold_at_idx" ON "sales" USING btree ("workshop_id","status","sold_at");--> statement-breakpoint
CREATE INDEX "sales_customer_id_idx" ON "sales" USING btree ("customer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_active_expiry_idx" ON "sessions" USING btree ("expires_at") WHERE "sessions"."revoked_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "stock_locations_one_default_unique" ON "stock_locations" USING btree ("workshop_id") WHERE "stock_locations"."is_default";--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_organization_tax_id_unique" ON "suppliers" USING btree ("organization_id","tax_id") WHERE "suppliers"."tax_id" is not null;--> statement-breakpoint
CREATE INDEX "suppliers_organization_name_idx" ON "suppliers" USING btree ("organization_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "workshops_organization_id_idx" ON "workshops" USING btree ("organization_id");