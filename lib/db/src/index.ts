import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import * as schema from "./schema";

const { Pool } = pg;

if (
  !process.env.PGUSER ||
  !process.env.PGPASSWORD ||
  !process.env.PGHOST ||
  !process.env.PGPORT ||
  !process.env.PGDATABASE
) {
  throw new Error(
    "PostgreSQL environment variables are incomplete. Expected PGUSER, PGPASSWORD, PGHOST, PGPORT and PGDATABASE.",
  );
}

export const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT),
  database: process.env.PGDATABASE,
});

export const db = drizzle(pool, { schema });

export * from "./schema";