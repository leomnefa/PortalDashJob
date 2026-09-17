import { describe, expect, it } from "vitest";
import { findDuplicateCandidates } from "../src/dedup.js";
import type { JobListing } from "../src/types.js";

function job(overrides: Partial<JobListing>): JobListing {
  return {
    id: "x",
    source: "test",
    sourceJobId: "1",
    title: "Backend Engineer",
    company: "Acme",
    url: "https://example.com",
    remote: true,
    tags: [],
    description: "",
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    ...overrides,
  };
}

describe("findDuplicateCandidates", () => {
  it("agrupa la misma empresa+título publicados en fuentes distintas", () => {
    const jobs = [
      job({ id: "remotive:1", source: "remotive" }),
      job({ id: "himalayas:1", source: "himalayas" }),
    ];
    const groups = findDuplicateCandidates(jobs);
    expect(groups).toHaveLength(1);
    expect(groups[0].jobs).toHaveLength(2);
  });

  it("no marca como duplicado si viene de la misma fuente", () => {
    const jobs = [
      job({ id: "remotive:1", source: "remotive", sourceJobId: "1" }),
      job({ id: "remotive:2", source: "remotive", sourceJobId: "2" }),
    ];
    expect(findDuplicateCandidates(jobs)).toHaveLength(0);
  });

  it("no marca como duplicado si el título es distinto", () => {
    const jobs = [
      job({ id: "remotive:1", source: "remotive", title: "Backend Engineer" }),
      job({ id: "himalayas:1", source: "himalayas", title: "Frontend Engineer" }),
    ];
    expect(findDuplicateCandidates(jobs)).toHaveLength(0);
  });

  it("ignora acentos/mayúsculas al normalizar", () => {
    const jobs = [
      job({ id: "remotive:1", source: "remotive", company: "Acme", title: "Ingeniería Backend" }),
      job({ id: "himalayas:1", source: "himalayas", company: "ACME", title: "ingenieria backend" }),
    ];
    expect(findDuplicateCandidates(jobs)).toHaveLength(1);
  });
});
