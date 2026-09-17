import { describe, expect, it } from "vitest";
import type { JobListing } from "@remote-job-hub/core";
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
    tags: ["node"],
    description: "desc",
    retrievedAt: new Date("2026-09-17T00:00:00Z").toISOString(),
    applyMode: "external",
    ...overrides,
  };
}

describe("SqlJobStore", () => {
  it("inserta y después actualiza (upsert) el mismo id sin duplicar", async () => {
    const { getPool, jobs } = createFakePool();
    const store = new SqlJobStore(getPool);

    await store.upsertMany([job({ title: "Backend Engineer" })]);
    await store.upsertMany([job({ title: "Senior Backend Engineer" })]);

    expect(jobs.size).toBe(1);
    const stored = await store.getById("remotive:1");
    expect(stored?.title).toBe("Senior Backend Engineer");
  });

  it("lista jobs ordenados por retrievedAt descendente", async () => {
    const { getPool } = createFakePool();
    const store = new SqlJobStore(getPool);
    await store.upsertMany([
      job({ id: "a", sourceJobId: "a", retrievedAt: new Date("2026-01-01").toISOString() }),
      job({ id: "b", sourceJobId: "b", retrievedAt: new Date("2026-06-01").toISOString() }),
    ]);
    const list = await store.list(10);
    expect(list.map((j) => j.id)).toEqual(["b", "a"]);
  });

  it("devuelve undefined si el id no existe", async () => {
    const { getPool } = createFakePool();
    const store = new SqlJobStore(getPool);
    expect(await store.getById("no-existe")).toBeUndefined();
  });

  it("conserva salary y rawData en el roundtrip", async () => {
    const { getPool } = createFakePool();
    const store = new SqlJobStore(getPool);
    await store.upsertMany([
      job({ salary: { min: 1000, max: 2000, currency: "USD", period: "month" }, rawData: { foo: "bar" } }),
    ]);
    const stored = await store.getById("remotive:1");
    expect(stored?.salary).toEqual({ min: 1000, max: 2000, currency: "USD", period: "month" });
    expect(stored?.rawData).toEqual({ foo: "bar" });
  });
});
