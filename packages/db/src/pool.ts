import sql, { type ConnectionPool } from "mssql";
import { getDbConfig } from "./config.js";

let poolPromise: Promise<ConnectionPool> | undefined;

export function getPool(): Promise<ConnectionPool> {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(getDbConfig()).connect().catch((err) => {
      poolPromise = undefined;
      throw err;
    });
  }
  return poolPromise;
}

export async function closePool(): Promise<void> {
  if (!poolPromise) return;
  const pool = await poolPromise;
  poolPromise = undefined;
  await pool.close();
}
