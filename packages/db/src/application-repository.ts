import { randomUUID } from "node:crypto";
import sql, { type ConnectionPool, type IResult } from "mssql";
import type { Application, ApplicationStatus, ApplicationStore, JobListing } from "@remote-job-hub/core";
import type { SqlJobStore } from "./job-repository.js";

interface ApplicationRow {
  id: string;
  jobId: string;
  status: string;
  cvText: string | null;
  coverLetterText: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EventRow {
  status: string;
  at: Date;
}

export class SqlApplicationStore implements ApplicationStore {
  constructor(
    private readonly getPool: () => Promise<ConnectionPool>,
    private readonly jobStore: SqlJobStore,
  ) {}

  private async hydrate(row: ApplicationRow): Promise<Application> {
    const pool = await this.getPool();
    const [job, events] = await Promise.all([
      this.jobStore.getById(row.jobId),
      pool
        .request()
        .input("applicationId", sql.UniqueIdentifier, row.id)
        .query<EventRow>(
          "SELECT status, at FROM [dbo].[ApplicationEvent] WHERE applicationId = @applicationId ORDER BY at ASC",
        ),
    ]);
    if (!job) throw new Error(`Job ${row.jobId} referenciado por la postulación ${row.id} no existe`);
    return {
      id: row.id,
      job,
      status: row.status as ApplicationStatus,
      cvText: row.cvText ?? undefined,
      coverLetterText: row.coverLetterText ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      history: events.recordset.map((e) => ({ status: e.status as ApplicationStatus, at: e.at.toISOString() })),
    };
  }

  async list(): Promise<Application[]> {
    const pool = await this.getPool();
    const result: IResult<ApplicationRow> = await pool
      .request()
      .query("SELECT * FROM [dbo].[Application] ORDER BY createdAt DESC");
    return Promise.all(result.recordset.map((row) => this.hydrate(row)));
  }

  async findByJobId(jobId: string): Promise<Application | undefined> {
    const pool = await this.getPool();
    const result: IResult<ApplicationRow> = await pool
      .request()
      .input("jobId", sql.NVarChar, jobId)
      .query("SELECT TOP (1) * FROM [dbo].[Application] WHERE jobId = @jobId ORDER BY createdAt DESC");
    const row = result.recordset[0];
    return row ? this.hydrate(row) : undefined;
  }

  async create(job: JobListing, opts: { cvText?: string; coverLetterText?: string } = {}): Promise<Application> {
    await this.jobStore.upsertMany([job]);
    const pool = await this.getPool();
    const id = randomUUID();
    const now = new Date();
    await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("jobId", sql.NVarChar, job.id)
      .input("status", sql.NVarChar, "found")
      .input("cvText", sql.NVarChar, opts.cvText ?? null)
      .input("coverLetterText", sql.NVarChar, opts.coverLetterText ?? null)
      .input("createdAt", sql.DateTime2, now)
      .input("updatedAt", sql.DateTime2, now)
      .query(`
        INSERT INTO [dbo].[Application] (id, jobId, status, cvText, coverLetterText, createdAt, updatedAt)
        VALUES (@id, @jobId, @status, @cvText, @coverLetterText, @createdAt, @updatedAt);
      `);
    await this.insertEvent(id, "found", now);
    const application = await this.findByJobId(job.id);
    if (!application) throw new Error("No se pudo leer la postulación recién creada");
    return application;
  }

  async updateStatus(id: string, status: ApplicationStatus): Promise<Application> {
    const pool = await this.getPool();
    const now = new Date();
    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("status", sql.NVarChar, status)
      .input("updatedAt", sql.DateTime2, now)
      .query("UPDATE [dbo].[Application] SET status = @status, updatedAt = @updatedAt WHERE id = @id");
    if (result.rowsAffected[0] === 0) throw new Error(`Application ${id} not found`);
    await this.insertEvent(id, status, now);
    const row = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .query<ApplicationRow>("SELECT * FROM [dbo].[Application] WHERE id = @id");
    return this.hydrate(row.recordset[0]);
  }

  private async insertEvent(applicationId: string, status: ApplicationStatus, at: Date): Promise<void> {
    const pool = await this.getPool();
    await pool
      .request()
      .input("applicationId", sql.UniqueIdentifier, applicationId)
      .input("status", sql.NVarChar, status)
      .input("at", sql.DateTime2, at)
      .query("INSERT INTO [dbo].[ApplicationEvent] (applicationId, status, at) VALUES (@applicationId, @status, @at)");
  }
}
