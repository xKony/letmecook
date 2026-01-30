import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Create neon client
const sql = neon(process.env.DATABASE_URL!);

// Create drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export schema for use in queries
export { schema };
