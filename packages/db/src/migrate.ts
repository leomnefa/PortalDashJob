import { getPool } from "./pool.js";
import { SCHEMA_STATEMENTS } from "./schema.js";

export async function migrate(): Promise<void> {
  const pool = await getPool();
  for (const statement of SCHEMA_STATEMENTS) {
    await pool.request().batch(statement);
  }
}
