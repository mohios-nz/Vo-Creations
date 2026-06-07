CREATE TABLE "campaign_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"handle" text NOT NULL,
	"profile_image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text DEFAULT 'sideshift' NOT NULL,
	"external_id" text NOT NULL,
	"name" text NOT NULL,
	"portfolio_url" text,
	"bio" text,
	"email" text,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_creators" (
	"program_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"role" text,
	"status" text DEFAULT 'active' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_creators_program_id_creator_id_pk" PRIMARY KEY("program_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"source" text DEFAULT 'sideshift' NOT NULL,
	"name" text NOT NULL,
	"company_id" text,
	"company_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "raw_ingest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"endpoint" text NOT NULL,
	"program_external_id" text,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payload" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "snapshots" (
	"snapshot_date" date NOT NULL,
	"program_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"lifetime_views" bigint NOT NULL,
	"lifetime_posts" integer DEFAULT 0 NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "snapshots_snapshot_date_program_id_creator_id_pk" PRIMARY KEY("snapshot_date","program_id","creator_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"programs_synced" integer DEFAULT 0,
	"rows_written" integer DEFAULT 0,
	"warnings" jsonb,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "campaign_accounts" ADD CONSTRAINT "campaign_accounts_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_accounts" ADD CONSTRAINT "campaign_accounts_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_creators" ADD CONSTRAINT "program_creators_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_creators" ADD CONSTRAINT "program_creators_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "snapshots" ADD CONSTRAINT "snapshots_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_account_program_creator_handle" ON "campaign_accounts" USING btree ("program_id","creator_id","platform","handle");--> statement-breakpoint
CREATE INDEX "ix_accounts_creator" ON "campaign_accounts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "ix_accounts_program" ON "campaign_accounts" USING btree ("program_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_creators_source_external" ON "creators" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "ix_progcreators_creator" ON "program_creators" USING btree ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_programs_source_external" ON "programs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "ix_raw_fetched" ON "raw_ingest" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "ix_snapshots_creator_date" ON "snapshots" USING btree ("creator_id","snapshot_date");--> statement-breakpoint
CREATE INDEX "ix_snapshots_program_date" ON "snapshots" USING btree ("program_id","snapshot_date");