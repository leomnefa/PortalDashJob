import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConnectorRegistry, loadProfileFromFile } from "@remote-job-hub/core";
import type { Profile } from "@remote-job-hub/core";
import { createRemotiveConnector } from "@remote-job-hub/connector-remotive";
import { createHimalayasConnector } from "@remote-job-hub/connector-himalayas";
import { createArbeitnowConnector } from "@remote-job-hub/connector-arbeitnow";
import { createRemoteOkConnector } from "@remote-job-hub/connector-remoteok";
import { createJobicyConnector } from "@remote-job-hub/connector-jobicy";
import { SqlApplicationStore, SqlJobStore, getPool, isDbConfigured, migrate } from "@remote-job-hub/db";

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PROFILE_PATH = path.join(REPO_ROOT, "data", "profile.json");

export function getRegistry(): ConnectorRegistry {
  const registry = new ConnectorRegistry();
  registry.register(createRemotiveConnector());
  registry.register(createHimalayasConnector());
  registry.register(createArbeitnowConnector());
  registry.register(createRemoteOkConnector());
  registry.register(createJobicyConnector());
  return registry;
}

export async function ensureDb(): Promise<void> {
  if (!isDbConfigured()) {
    throw new Error(
      "El servidor de API requiere una base configurada (DB_HOST/DB_USER/DB_PASSWORD/DB_NAME en .env). " +
        "Para uso local sin DB usá la CLI (npm run cli -- ...).",
    );
  }
  await migrate();
}

export function getJobStore(): SqlJobStore {
  return new SqlJobStore(getPool);
}

export function getApplicationStore(): SqlApplicationStore {
  return new SqlApplicationStore(getPool, getJobStore());
}

export function loadProfile(): Promise<Profile> {
  return loadProfileFromFile(PROFILE_PATH);
}
