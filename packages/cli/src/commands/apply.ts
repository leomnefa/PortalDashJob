import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { generateCoverLetter, generateTailoredCv } from "@remote-job-hub/core";
import type { JobListing } from "@remote-job-hub/core";
import { getTracker, loadProfile, LAST_SEARCH_PATH, OUTPUT_DIR } from "../context.js";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function runApply(index: number): Promise<void> {
  const raw = await readFile(LAST_SEARCH_PATH, "utf-8").catch(() => {
    throw new Error('No hay resultados guardados. Corré "npm run search" primero.');
  });
  const jobs = JSON.parse(raw) as JobListing[];
  const job = jobs[index];
  if (!job) throw new Error(`No existe el resultado con índice ${index} (hay ${jobs.length}).`);

  const profile = await loadProfile();
  const cv = generateTailoredCv(profile, job);
  const coverLetter = generateCoverLetter(profile, job);

  await mkdir(OUTPUT_DIR, { recursive: true });
  const slug = `${slugify(job.company)}-${slugify(job.title)}`;
  const cvPath = path.join(OUTPUT_DIR, `${slug}-cv.md`);
  const letterPath = path.join(OUTPUT_DIR, `${slug}-carta.md`);
  await writeFile(cvPath, cv, "utf-8");
  await writeFile(letterPath, coverLetter, "utf-8");

  const tracker = getTracker();
  const existing = await tracker.findByJobId(job.id);
  const created = existing ?? (await tracker.create(job, { cvText: cv, coverLetterText: coverLetter }));
  const application = await tracker.updateStatus(created.id, "drafted");

  console.log(`CV guardado en ${cvPath}`);
  console.log(`Carta de presentación guardada en ${letterPath}`);
  console.log(`Postulación #${application.id} marcada como "drafted".`);
  if (job.applyMode === "external") {
    console.log(`Postulá manualmente acá: ${job.url}`);
    console.log('Cuando confirmes el envío, corré: npm run track -- status <id> submitted');
  }
}
