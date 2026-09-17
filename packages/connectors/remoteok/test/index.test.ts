import { describe, expect, it, vi } from "vitest";
import { createRemoteOkConnector } from "../src/index.js";

const FIXTURE = [
  { legal: "Please read our API terms", id: undefined },
  {
    id: 12345,
    slug: "backend-engineer-acme",
    company: "Acme",
    position: "Backend Engineer",
    tags: ["node", "backend"],
    description: "<p>Buscamos <b>Backend Engineer</b> con Node.js.</p>",
    location: "Worldwide",
    url: "https://remoteok.com/remote-jobs/12345",
    date: "2026-09-01T00:00:00+00:00",
    salary_min: 60000,
    salary_max: 90000,
  },
  {
    id: 67890,
    slug: "data-analyst-other",
    company: "Other Co",
    position: "Data Analyst",
    tags: ["data"],
    description: "Buscamos analista de datos con SQL.",
    location: "",
    url: "https://remoteok.com/remote-jobs/67890",
    date: "2026-08-28T00:00:00+00:00",
  },
];

describe("remoteok connector", () => {
  it("descarta el primer elemento (aviso legal) y mapea el resto", async () => {
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toContain("remoteok.com/api");
      expect((init?.headers as Record<string, string>)["User-Agent"]).toContain("remote-job-hub");
      return { ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response;
    });

    const connector = createRemoteOkConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({});

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "remoteok:12345",
      source: "remoteok",
      sourceJobId: "12345",
      title: "Backend Engineer",
      company: "Acme",
      remote: true,
      applyMode: "external",
    });
    expect(results[0].salary).toEqual({ min: 60000, max: 90000, currency: "USD" });
    expect(results[1].salary).toBeUndefined();
  });

  it("filtra client-side por keyword", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response));
    const connector = createRemoteOkConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ keywords: ["sql"] });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Data Analyst");
  });

  it("propaga un error si la API responde con un status no-ok", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 403, statusText: "Forbidden" } as Response));
    const connector = createRemoteOkConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(connector.search({})).rejects.toThrow("403");
  });
});
