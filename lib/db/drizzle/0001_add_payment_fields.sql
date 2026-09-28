ALTER TABLE "scans" ADD COLUMN "payment_status" text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "stripe_checkout_session_id" text;--> statement-breakpoint
ALTER TABLE "scans" ADD COLUMN "paid_at" timestamp with time zone;