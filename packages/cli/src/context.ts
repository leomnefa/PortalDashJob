import path from "node:path";
import { fileURLToPath } from "node:url";
import { ConnectorRegistry, JsonApplicationStore, loadProfileFromFile } from "@remote-job-hub/core";
import type { ApplicationStore, Connector, Profile } from "@remote-job-hub/core";
import { createRemotiveConnector } from "@remote-job-hub/connector-remotive";
import { createHimalayasConnector } from "@remote-job-hub/connector-himalayas";
import { SqlApplicationStore, SqlJobStore, getPool, isDbConfigured, migrate } from "@remote-job-hub/db";

// packages/cli/{src,dist}/context.{ts,js} está siempre a 3 niveles del repo root,
// así que resolvemos desde acá en vez de process.cwd() (npm workspaces corre los
// scripts con cwd = el package, no el repo root).
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA_DIR = path.join(REPO_ROOT, "data");
export const PROFILE_PATH = path.join(DATA_DIR, "profile.json");
export const APPLICATIONS_PATH = path.join(DATA_DIR, "applications.json");
export const LAST_SEARCH_PATH = path.join(DATA_DIR, "last-search.json");
export const OUTPUT_DIR = path.join(DATA_DIR, "output");

export function getRegistry(): ConnectorRegistry {
  const registry = new ConnectorRegistry();
  registry.register(createRemotiveConnector());
  registry.register(createHimalayasConnector());
  return registry;
}

export function getConnectors(): Connector[] {
  return getRegistry().list();
}

/**
 * Sin DB_* configuradas usa el JSON local (zero-config, como hasta ahora).
 * Con DB_* configuradas usa SQL Server — mismo contrato (ApplicationStore),
 * así que search/apply/track no cambian.
 */
export async function getTracker(): Promise<ApplicationStore> {
  if (!isDbConfigured()) return new JsonApplicationStore(APPLICATIONS_PATH);
  await migrate();
  return new SqlApplicationStore(getPool, new SqlJobStore(getPool));
}

export async function loadProfile(): Promise<Profile> {
  return loadProfileFromFile(PROFILE_PATH);
}
