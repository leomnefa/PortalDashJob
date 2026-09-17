import { ApplicationStatusSchema } from "@remote-job-hub/core";
import { getTracker } from "../context.js";

export async function runTrackList(): Promise<void> {
  const tracker = getTracker();
  const applications = await tracker.list();
  if (!applications.length) {
    console.log("Todavía no hay postulaciones registradas.");
    return;
  }
  for (const app of applications) {
    console.log(`${app.id}  [${app.status}]  ${app.job.title} — ${app.job.company} (${app.job.source})`);
  }
}

export async function runTrackStatus(id: string, statusInput: string): Promise<void> {
  const status = ApplicationStatusSchema.parse(statusInput);
  const tracker = getTracker();
  const updated = await tracker.updateStatus(id, status);
  console.log(`Postulación #${updated.id} → ${updated.status}`);
}
