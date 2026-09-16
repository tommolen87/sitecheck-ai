import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  status: text("status").notNull().default("queued"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({
  id: true,
  createdAt: true,
});

export type InsertScan = typeof scansTable.$inferInsert;
export type Scan = typeof scansTable.$inferSelect;