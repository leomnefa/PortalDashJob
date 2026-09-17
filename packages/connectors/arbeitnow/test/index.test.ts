import { describe, expect, it, vi } from "vitest";
import { createArbeitnowConnector } from "../src/index.js";

const FIXTURE = {
  data: [
    {
      slug: "backend-engineer-acme",
      company_name: "Acme",
      title: "Backend Engineer",
      description: "<p>Buscamos <b>Backend Engineer</b> con Node.js.</p>",
      remote: true,
      url: "https://www.arbeitnow.com/jobs/backend-engineer-acme",
      tags: ["node", "backend"],
      job_types: ["full_time"],
      location: "Berlin, Germany",
      created_at: 1756684800,
    },
    {
      slug: "data-analyst-other",
      company_name: "Other Co",
      title: "Data Analyst",
      description: "Buscamos analista de datos con SQL.",
      remote: false,
      url: "https://www.arbeitnow.com/jobs/data-analyst-other",
      tags: ["data"],
      job_types: ["contract"],
      location: "Madrid, Spain",
      created_at: 1756598400,
    },
  ],
};

describe("arbeitnow connector", () => {
  it("mapea la respuesta de la API a JobListing", async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      expect(String(url)).toContain("arbeitnow.com/api/job-board-api");
      return { ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response;
    });

    const connector = createArbeitnowConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({});

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "arbeitnow:backend-engineer-acme",
      source: "arbeitnow",
      sourceJobId: "backend-engineer-acme",
      title: "Backend Engineer",
      company: "Acme",
      remote: true,
      employmentType: "full_time",
      applyMode: "external",
    });
    expect(results[0].description).toBe("Buscamos Backend Engineer con Node.js.");
  });

  it("filtra client-side por keyword ya que la API no soporta búsqueda server-side", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response));
    const connector = createArbeitnowConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ keywords: ["sql"] });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Data Analyst");
  });

  it("propaga un error si la API responde con un status no-ok", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, statusText: "Internal Error" } as Response));
    const connector = createArbeitnowConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(connector.search({})).rejects.toThrow("500");
  });
});
