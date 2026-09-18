CREATE TABLE "scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"status" text DEFAULT 'analyzing' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analysis" jsonb,
	"error" text
);
