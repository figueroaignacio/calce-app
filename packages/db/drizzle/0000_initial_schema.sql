-- pgvector tiene que existir antes de que se cree la columna
-- `products.embedding`, que es de tipo vector(1536).
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'SELLER', 'WAREHOUSE');--> statement-breakpoint
CREATE TYPE "public"."product_code_type" AS ENUM('OEM', 'MANUFACTURER', 'INTERNAL');--> statement-breakpoint
CREATE TYPE "public"."tax_condition" AS ENUM('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'EXENTO', 'CONSUMIDOR_FINAL');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'CONFIRMED', 'IN_PREPARATION', 'SHIPPED', 'DELIVERED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('INBOUND', 'OUTBOUND', 'ADJUSTMENT', 'RESERVATION');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(120) NOT NULL,
	"role" "user_role" DEFAULT 'SELLER' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicle_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_brand_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vehicle_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_model_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"engine" varchar(80)
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"parent_id" uuid
);
--> statement-breakpoint
CREATE TABLE "part_brands" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"vehicle_version_id" uuid NOT NULL,
	"year_from" smallint NOT NULL,
	"year_to" smallint
);
--> statement-breakpoint
CREATE TABLE "product_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "product_code_type" NOT NULL,
	"code" varchar(64) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_equivalences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"equivalent_product_id" uuid NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sku" varchar(64) NOT NULL,
	"description" varchar(500) NOT NULL,
	"normalized_description" varchar(500),
	"part_brand_id" uuid,
	"category_id" uuid,
	"list_price" numeric(12, 2) DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0 NOT NULL,
	"warehouse_location" varchar(64),
	"embedding" vector(1536),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" varchar(200) NOT NULL,
	"tax_id" char(11) NOT NULL,
	"tax_condition" "tax_condition" DEFAULT 'RESPONSABLE_INSCRIPTO' NOT NULL,
	"email" varchar(255),
	"phone" varchar(40),
	"address" varchar(200),
	"price_list_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"discount" numeric(5, 2) DEFAULT 0 NOT NULL,
	"subtotal" numeric(12, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(32) NOT NULL,
	"customer_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount" numeric(5, 2) DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"resulting_stock" integer NOT NULL,
	"order_id" uuid,
	"user_id" uuid,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vehicle_models" ADD CONSTRAINT "vehicle_models_vehicle_brand_id_vehicle_brands_id_fk" FOREIGN KEY ("vehicle_brand_id") REFERENCES "public"."vehicle_brands"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicle_versions" ADD CONSTRAINT "vehicle_versions_vehicle_model_id_vehicle_models_id_fk" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_applications" ADD CONSTRAINT "product_applications_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_applications" ADD CONSTRAINT "product_applications_vehicle_version_id_vehicle_versions_id_fk" FOREIGN KEY ("vehicle_version_id") REFERENCES "public"."vehicle_versions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_codes" ADD CONSTRAINT "product_codes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_equivalences" ADD CONSTRAINT "product_equivalences_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_equivalences" ADD CONSTRAINT "product_equivalences_equivalent_product_id_products_id_fk" FOREIGN KEY ("equivalent_product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_part_brand_id_part_brands_id_fk" FOREIGN KEY ("part_brand_id") REFERENCES "public"."part_brands"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_brands_name_key" ON "vehicle_brands" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_models_brand_name_key" ON "vehicle_models" USING btree ("vehicle_brand_id","name");--> statement-breakpoint
CREATE INDEX "vehicle_models_brand_idx" ON "vehicle_models" USING btree ("vehicle_brand_id");--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_versions_model_name_key" ON "vehicle_versions" USING btree ("vehicle_model_id","name");--> statement-breakpoint
CREATE INDEX "vehicle_versions_model_idx" ON "vehicle_versions" USING btree ("vehicle_model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_key" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "part_brands_name_key" ON "part_brands" USING btree ("name");--> statement-breakpoint
CREATE INDEX "product_applications_product_idx" ON "product_applications" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_applications_version_idx" ON "product_applications" USING btree ("vehicle_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_applications_unique_key" ON "product_applications" USING btree ("product_id","vehicle_version_id","year_from");--> statement-breakpoint
CREATE UNIQUE INDEX "product_codes_type_code_key" ON "product_codes" USING btree ("type","code","product_id");--> statement-breakpoint
CREATE INDEX "product_codes_code_idx" ON "product_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "product_codes_product_idx" ON "product_codes" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_equivalences_pair_key" ON "product_equivalences" USING btree ("product_id","equivalent_product_id");--> statement-breakpoint
CREATE INDEX "product_equivalences_product_idx" ON "product_equivalences" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_key" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "products_part_brand_idx" ON "products" USING btree ("part_brand_id");--> statement-breakpoint
CREATE INDEX "products_description_idx" ON "products" USING btree ("normalized_description");--> statement-breakpoint
CREATE INDEX "products_embedding_hnsw_idx" ON "products" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "customers_tax_id_key" ON "customers" USING btree ("tax_id");--> statement-breakpoint
CREATE INDEX "customers_business_name_idx" ON "customers" USING btree ("business_name");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_number_key" ON "orders" USING btree ("number");--> statement-breakpoint
CREATE INDEX "orders_customer_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_date_idx" ON "orders" USING btree ("date");--> statement-breakpoint
CREATE INDEX "stock_movements_product_created_idx" ON "stock_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_order_idx" ON "stock_movements" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");