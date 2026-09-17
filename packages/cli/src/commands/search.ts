import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { JobListing } from "@remote-job-hub/core";
import { getConnectors, LAST_SEARCH_PATH } from "../context.js";

export async function runSearch(keywords: string[], limit: number): Promise<void> {
  const connectors = getConnectors();
  const results = await Promise.allSettled(
    connectors.map((connector) => connector.search({ keywords, limit })),
  );

  const jobs: JobListing[] = [];
  results.forEach((result, i) => {
    const connector = connectors[i];
    if (result.status === "fulfilled") {
      jobs.push(...result.value);
    } else {
      console.error(`[${connector.id}] falló la búsqueda: ${(result.reason as Error).message}`);
    }
  });

  await mkdir(dirname(LAST_SEARCH_PATH), { recursive: true });
  await writeFile(LAST_SEARCH_PATH, JSON.stringify(jobs, null, 2), "utf-8");

  if (!jobs.length) {
    console.log("No se encontraron resultados.");
    return;
  }

  jobs.forEach((job, i) => {
    console.log(`[${i}] (${job.source}) ${job.title} — ${job.company}`);
    console.log(`    ${job.location ?? "Remoto"} · ${job.url}`);
  });
  console.log(`\n${jobs.length} resultados guardados. Usá "npm run apply -- <índice>" para generar el CV a medida.`);
}
