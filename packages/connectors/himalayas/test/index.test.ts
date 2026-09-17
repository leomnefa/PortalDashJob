import { describe, expect, it, vi } from "vitest";
import { createHimalayasConnector } from "../src/index.js";

const FIXTURE = {
  jobs: [
    {
      guid: "abc",
      title: "Frontend Engineer",
      companyName: "Remote Studio",
      applicationLink: "https://himalayas.app/companies/remote-studio/jobs/abc",
      locationRestrictions: ["Argentina", "Brazil"],
      categories: ["react", "frontend"],
      description: "Buscamos Frontend Engineer con React.",
      pubDate: 1756684800,
    },
    {
      guid: "def",
      title: "Data Analyst",
      companyName: "Other Co",
      applicationLink: "https://himalayas.app/companies/other-co/jobs/def",
      locationRestrictions: [],
      categories: ["data"],
      description: "Buscamos analista de datos con SQL.",
    },
  ],
};

describe("himalayas connector", () => {
  it("mapea la respuesta de la API a JobListing", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => FIXTURE,
    } as Response));

    const connector = createHimalayasConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({});

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: "himalayas:abc",
      source: "himalayas",
      title: "Frontend Engineer",
      company: "Remote Studio",
      location: "Argentina, Brazil",
      remote: true,
    });
  });

  it("filtra client-side por keyword ya que el server-side no está garantizado", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => FIXTURE,
    } as Response));

    const connector = createHimalayasConnector({ fetchImpl: fetchImpl as unknown as typeof fetch });
    const results = await connector.search({ keywords: ["react"] });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Frontend Engineer");
  });
});
