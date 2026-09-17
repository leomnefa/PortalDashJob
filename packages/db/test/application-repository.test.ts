import { describe, expect, it } from "vitest";
import type { JobListing } from "@remote-job-hub/core";
import { SqlApplicationStore } from "../src/application-repository.js";
import { SqlJobStore } from "../src/job-repository.js";
import { createFakePool } from "./fake-pool.js";

function job(overrides: Partial<JobListing> = {}): JobListing {
  return {
    id: "remotive:1",
    source: "remotive",
    sourceJobId: "1",
    title: "Backend Engineer",
    company: "Acme",
    url: "https://example.com/1",
    remote: true,
    tags: [],
    description: "desc",
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    ...overrides,
  };
}

function makeStores() {
  const { getPool, jobs, applications, events } = createFakePool();
  const jobStore = new SqlJobStore(getPool);
  const applicationStore = new SqlApplicationStore(getPool, jobStore);
  return { applicationStore, jobStore, jobs, applications, events };
}

describe("SqlApplicationStore", () => {
  it("crea una postulación, la persiste con estado inicial found y registra el evento", async () => {
    const { applicationStore, jobs, events } = makeStores();
    const application = await applicationStore.create(job(), { cvText: "cv", coverLetterText: "carta" });

    expect(application.status).toBe("found");
    expect(application.job.id).toBe("remotive:1");
    expect(application.history).toEqual([{ status: "found", at: expect.any(String) }]);
    expect(jobs.size).toBe(1); // create() debe upsertear el job para satisfacer la FK
    expect(events).toHaveLength(1);
  });

  it("updateStatus agrega al historial en vez de reemplazarlo", async () => {
    const { applicationStore } = makeStores();
    const created = await applicationStore.create(job());
    await applicationStore.updateStatus(created.id, "drafted");
    const updated = await applicationStore.updateStatus(created.id, "submitted");

    expect(updated.status).toBe("submitted");
    expect(updated.history.map((h) => h.status)).toEqual(["found", "drafted", "submitted"]);
  });

  it("updateStatus falla si la postulación no existe", async () => {
    const { applicationStore } = makeStores();
    await expect(applicationStore.updateStatus("no-existe", "submitted")).rejects.toThrow("not found");
  });

  it("findByJobId encuentra la postulación asociada a un job", async () => {
    const { applicationStore } = makeStores();
    const created = await applicationStore.create(job());
    const found = await applicationStore.findByJobId("remotive:1");
    expect(found?.id).toBe(created.id);
  });

  it("list devuelve todas las postulaciones con su job hidratado", async () => {
    const { applicationStore } = makeStores();
    await applicationStore.create(job({ id: "remotive:1", sourceJobId: "1" }));
    await applicationStore.create(job({ id: "remotive:2", sourceJobId: "2", title: "Frontend Engineer" }));
    const all = await applicationStore.list();
    expect(all).toHaveLength(2);
    expect(all.map((a) => a.job.title).sort()).toEqual(["Backend Engineer", "Frontend Engineer"]);
  });
});
