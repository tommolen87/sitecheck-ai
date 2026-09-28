import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const scans = pgTable("scans", {
	id: serial().primaryKey().notNull(),
	url: text().notNull(),
	status: text().default('analyzing').notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	analysis: jsonb(),
	error: text(),
	paymentStatus: text("payment_status").default('unpaid').notNull(),
	stripeCheckoutSessionId: text("stripe_checkout_session_id"),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
});
