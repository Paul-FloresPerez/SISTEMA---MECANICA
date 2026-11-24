ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username" varchar(64) NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_unique" ON "users" USING btree (lower("username"));--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_format_check" CHECK ("users"."username" ~ '^[a-z0-9][a-z0-9._-]{2,63}$');