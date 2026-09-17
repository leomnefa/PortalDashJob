import { describe, expect, it, vi } from "vitest";
import { createRemotiveConnector } from "../src/index.js";

const FIXTURE = {
  jobs: [
    {
      id: 123,
      url: "https://remotive.com/remote-jobs/123",
      title: "Backend Engineer",
      company_name: "Acme Remote",
      candidate_required_location: "Worldwide",
      tags: ["python", "backend"],
      description: "<p>Buscamos <b>Backend Engineer</b> con Python.</p>",
      publication_date: "2026-09-01T00:00:00",
    },
  ],
};

describe("remotive connector", () => {
  it("mapea la respuesta de la API a JobListing", async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      expect(String(url)).toContain("remotive.com/api/remote-jobs");
      return {
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FIXTURE,
      } as Response;
    });

    const connector = createRemotiveConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ keywords: ["backend"], limit: 10 });

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      id: "remotive:123",
      source: "remotive",
      title: "Backend Engineer",
      company: "Acme Remote",
      remote: true,
      applyMode: "external",
    });
    expect(results[0].description).toBe("Buscamos Backend Engineer con Python.");
  });

  it("propaga un error si la API responde con un status no-ok", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 500, statusText: "Internal Error" } as Response));
    const connector = createRemotiveConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    await expect(connector.search({})).rejects.toThrow("500");
  });
});
