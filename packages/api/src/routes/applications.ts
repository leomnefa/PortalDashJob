import type { FastifyInstance } from "fastify";
import { ApplicationStatusSchema, generateCoverLetter, generateTailoredCv } from "@remote-job-hub/core";
import { getApplicationStore, getJobStore, loadProfile } from "../context.js";

export async function registerApplicationRoutes(app: FastifyInstance): Promise<void> {
  const applicationStore = getApplicationStore();
  const jobStore = getJobStore();

  app.get("/api/applications", async () => {
    return { applications: await applicationStore.list() };
  });

  app.post("/api/applications", async (req, reply) => {
    const { jobId } = req.body as { jobId?: string };
    if (!jobId) return reply.code(400).send({ error: "Falta jobId" });

    const job = await jobStore.getById(jobId);
    if (!job) return reply.code(404).send({ error: `No existe el job ${jobId}` });

    const existing = await applicationStore.findByJobId(jobId);
    if (existing) return reply.code(409).send({ error: "Ya existe una postulación para este job", application: existing });

    const profile = await loadProfile();
    const cvText = generateTailoredCv(profile, job);
    const coverLetterText = generateCoverLetter(profile, job);
    const application = await applicationStore.create(job, { cvText, coverLetterText });
    return reply.code(201).send({ application });
  });

  app.patch("/api/applications/:id/status", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parsed = ApplicationStatusSchema.safeParse((req.body as { status?: string }).status);
    if (!parsed.success) return reply.code(400).send({ error: "Estado inválido" });

    try {
      const application = await applicationStore.updateStatus(id, parsed.data);
      return { application };
    } catch (err) {
      return reply.code(404).send({ error: (err as Error).message });
    }
  });
}
