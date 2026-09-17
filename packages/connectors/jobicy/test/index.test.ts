import { describe, expect, it, vi } from "vitest";
import { createJobicyConnector } from "../src/index.js";

const FIXTURE = {
  jobs: [
    {
      id: 111,
      url: "https://jobicy.com/jobs/111-backend-engineer",
      jobTitle: "Backend Engineer",
      companyName: "Acme",
      jobIndustry: ["Dev"],
      jobType: ["full-time"],
      jobGeo: "Worldwide",
      jobDescription: "<p>Buscamos <b>Backend Engineer</b> con Node.js.</p>",
      pubDate: "2026-09-01 00:00:00",
      annualSalaryMin: 60000,
      annualSalaryMax: 90000,
      salaryCurrency: "USD",
    },
    {
      id: 222,
      url: "https://jobicy.com/jobs/222-data-analyst",
      jobTitle: "Data Analyst",
      companyName: "Other Co",
      jobIndustry: ["Data"],
      jobExcerpt: "Buscamos analista de datos con SQL.",
      pubDate: "not-a-real-date",
    },
  ],
};

describe("jobicy connector", () => {
  it("mapea la respuesta de la API a JobListing, incluyendo salario estructurado", async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      expect(String(url)).toContain("jobicy.com/api/v2/remote-jobs");
      return { ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response;
    });

    const connector = createJobicyConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ limit: 10 });

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "jobicy:111",
      source: "jobicy",
      sourceJobId: "111",
      title: "Backend Engineer",
      employmentType: "full_time",
      applyMode: "external",
    });
    expect(results[0].salary).toEqual({ min: 60000, max: 90000, currency: "USD", period: "year" });
    expect(results[0].description).toBe("Buscamos Backend Engineer con Node.js.");
  });

  it("no revienta con una fecha de publicación inválida", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response));
    const connector = createJobicyConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({});
    expect(results[1].postedAt).toBeUndefined();
    expect(results[1].salary).toBeUndefined();
  });

  it("filtra client-side por keyword además del tag best-effort", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, status: 200, statusText: "OK", json: async () => FIXTURE } as Response));
    const connector = createJobicyConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ keywords: ["sql"] });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Data Analyst");
  });

  it("propaga un error si la API responde con un status no-ok", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, statusText: "Internal Error" } as Response));
    const connector = createJobicyConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(connector.search({})).rejects.toThrow("500");
  });
});
