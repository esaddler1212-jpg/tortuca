CREATE TABLE "films" (
	"id" varchar(64) PRIMARY KEY,
	"slug" varchar(128) NOT NULL UNIQUE,
	"title" varchar(255) NOT NULL,
	"tagline" text NOT NULL,
	"synopsis" text NOT NULL,
	"year" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"genres" jsonb NOT NULL,
	"maturity" varchar(8) NOT NULL,
	"director" varchar(255) NOT NULL,
	"cast" jsonb NOT NULL,
	"poster_url" text NOT NULL,
	"backdrop_url" text NOT NULL,
	"video_url" text,
	"video_blob_key" varchar(512),
	"hls_manifest_url" text,
	"featured" boolean DEFAULT false,
	"trending_rank" integer,
	"award_winner" boolean DEFAULT false,
	"festival" varchar(128),
	"requires_premium" boolean DEFAULT false,
	"allowed_countries" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"user_id" varchar(128) PRIMARY KEY,
	"stripe_customer_id" varchar(128),
	"stripe_subscription_id" varchar(128),
	"status" varchar(32) DEFAULT 'inactive' NOT NULL,
	"plan" varchar(32) DEFAULT 'free' NOT NULL,
	"current_period_end" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_list_items" (
	"user_id" varchar(128),
	"film_id" varchar(64),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "user_list_items_pkey" PRIMARY KEY("user_id","film_id")
);
--> statement-breakpoint
CREATE TABLE "watch_progress" (
	"user_id" varchar(128),
	"film_id" varchar(64),
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "watch_progress_pkey" PRIMARY KEY("user_id","film_id")
);
--> statement-breakpoint
ALTER TABLE "user_list_items" ADD CONSTRAINT "user_list_items_film_id_films_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "watch_progress" ADD CONSTRAINT "watch_progress_film_id_films_id_fkey" FOREIGN KEY ("film_id") REFERENCES "films"("id") ON DELETE CASCADE;