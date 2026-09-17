import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { randomUUID } from "node:crypto";
import type { Application, ApplicationStatus, JobListing } from "./types.js";

export class ApplicationTracker {
  constructor(private readonly filePath: string) {}

  private async readAll(): Promise<Application[]> {
    try {
      const raw = await readFile(this.filePath, "utf-8");
      return JSON.parse(raw) as Application[];
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
  }

  private async writeAll(applications: Application[]): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(applications, null, 2), "utf-8");
  }

  async list(): Promise<Application[]> {
    return this.readAll();
  }

  async findByJobId(jobId: string): Promise<Application | undefined> {
    const all = await this.readAll();
    return all.find((a) => a.job.id === jobId);
  }

  async create(job: JobListing, opts: { cvText?: string; coverLetterText?: string } = {}): Promise<Application> {
    const now = new Date().toISOString();
    const application: Application = {
      id: randomUUID(),
      job,
      status: "found",
      cvText: opts.cvText,
      coverLetterText: opts.coverLetterText,
      createdAt: now,
      updatedAt: now,
      history: [{ status: "found", at: now }],
    };
    const all = await this.readAll();
    all.push(application);
    await this.writeAll(all);
    return application;
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const all = await this.readAll();
    const application = all.find((a) => a.id === id);
    if (!application) throw new Error(`Application ${id} not found`);
    const now = new Date().toISOString();
    application.status = status;
    application.updatedAt = now;
    application.history.push({ status, at: now });
    await this.writeAll(all);
    return application;
  }
}
