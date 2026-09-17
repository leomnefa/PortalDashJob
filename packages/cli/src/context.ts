import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ApplicationTracker, ProfileSchema } from "@remote-job-hub/core";
import type { Connector, Profile } from "@remote-job-hub/core";
import { createRemotiveConnector } from "@remote-job-hub/connector-remotive";
import { createHimalayasConnector } from "@remote-job-hub/connector-himalayas";

// packages/cli/{src,dist}/context.{ts,js} está siempre a 3 niveles del repo root,
// así que resolvemos desde acá en vez de process.cwd() (npm workspaces corre los
// scripts con cwd = el package, no el repo root).
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const DATA_DIR = path.join(REPO_ROOT, "data");
export const PROFILE_PATH = path.join(DATA_DIR, "profile.json");
export const APPLICATIONS_PATH = path.join(DATA_DIR, "applications.json");
export const LAST_SEARCH_PATH = path.join(DATA_DIR, "last-search.json");
export const OUTPUT_DIR = path.join(DATA_DIR, "output");

export function getConnectors(): Connector[] {
  return [createRemotiveConnector(), createHimalayasConnector()];
}

export function getTracker(): ApplicationTracker {
  return new ApplicationTracker(APPLICATIONS_PATH);
}

export async function loadProfile(): Promise<Profile> {
  let raw: string;
  try {
    raw = await readFile(PROFILE_PATH, "utf-8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `No encontré ${PROFILE_PATH}. Copiá data/profile.example.json a data/profile.json y completá tus datos.`,
      );
    }
    throw err;
  }
  return ProfileSchema.parse(JSON.parse(raw));
}
