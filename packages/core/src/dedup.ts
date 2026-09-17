import type { JobListing } from "./types.js";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface DuplicateGroup {
  key: string;
  jobs: JobListing[];
}

/**
 * Heurística de detección de duplicados cross-source: normaliza company+title y
 * agrupa. Es una aproximación intencionalmente conservadora (sin similarity
 * scoring sobre la descripción todavía) — nunca decide sola: expone los grupos
 * para que el usuario o una capa superior confirme, no borra nada.
 */
export function findDuplicateCandidates(jobs: JobListing[]): DuplicateGroup[] {
  const groups = new Map<string, JobListing[]>();
  for (const job of jobs) {
    const key = `${normalize(job.company)}|${normalize(job.title)}`;
    const group = groups.get(key) ?? [];
    group.push(job);
    groups.set(key, group);
  }
  return Array.from(groups.entries())
    .filter(([, groupJobs]) => new Set(groupJobs.map((j) => j.source)).size > 1)
    .map(([key, groupJobs]) => ({ key, jobs: groupJobs }));
}
