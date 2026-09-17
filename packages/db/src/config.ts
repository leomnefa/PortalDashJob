import type { config as MssqlConfig } from "mssql";

export function isDbConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.DB_HOST && env.DB_USER && env.DB_PASSWORD && env.DB_NAME);
}

export function getDbConfig(env: NodeJS.ProcessEnv = process.env): MssqlConfig {
  if (!isDbConfigured(env)) {
    throw new Error(
      "Faltan variables de entorno de DB: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME son obligatorias.",
    );
  }
  return {
    server: env.DB_HOST!,
    port: env.DB_PORT ? Number(env.DB_PORT) : 1433,
    user: env.DB_USER!,
    password: env.DB_PASSWORD!,
    database: env.DB_NAME!,
    options: {
      encrypt: env.DB_ENCRYPT !== "false",
      trustServerCertificate: env.DB_TRUST_SERVER_CERTIFICATE !== "false",
    },
  };
}
