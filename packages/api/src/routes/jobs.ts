import type { FastifyInstance } from "fastify";
import { findDuplicateCandidates } from "@remote-job-hub/core";
import type { JobListing } from "@remote-job-hub/core";
import { getJobStore, getRegistry } from "../context.js";

interface SearchBody {
  keywords?: string[];
  limit?: number;
}

export async function registerJobRoutes(app: FastifyInstance): Promise<void> {
  const jobStore = getJobStore();
  const registry = getRegistry();

  app.get("/api/jobs", async (req) => {
    const limit = Number((req.query as { limit?: string }).limit ?? 50);
    return { jobs: await jobStore.list(limit) };
  });

  app.get("/api/jobs/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const job = await jobStore.getById(id);
    if (!job) return reply.code(404).send({ error: `No existe el job ${id}` });
    return { job };
  });

  app.post("/api/jobs/search", async (req) => {
    const body = req.body as SearchBody;
    const connectors = registry.list();
    const settled = await Promise.allSettled(
      connectors.map((c) => c.search({ keywords: body.keywords, limit: body.limit })),
    );

    const jobs: JobListing[] = [];
    const errors: { connectorId: string; message: string }[] = [];
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") jobs.push(...result.value);
      else errors.push({ connectorId: connectors[i].id, message: (result.reason as Error).message });
    });

    if (jobs.length) await jobStore.upsertMany(jobs);
    const duplicates = findDuplicateCandidates(jobs);

    return { jobs, errors, duplicates };
  });
}
