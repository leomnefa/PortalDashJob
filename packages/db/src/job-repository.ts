import sql, { type ConnectionPool, type IResult } from "mssql";
import type { ApplyMode, EmploymentType, JobListing, JobStore, Seniority } from "@remote-job-hub/core";

interface JobRow {
  id: string;
  source: string;
  sourceJobId: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  remote: boolean;
  employmentType: string | null;
  seniority: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  salaryPeriod: string | null;
  tags: string;
  description: string;
  postedAt: Date | null;
  retrievedAt: Date;
  applyMode: string;
  rawData: string | null;
}

function rowToJobListing(row: JobRow): JobListing {
  const hasSalary = row.salaryMin != null || row.salaryMax != null || row.salaryCurrency || row.salaryPeriod;
  return {
    id: row.id,
    source: row.source,
    sourceJobId: row.sourceJobId,
    title: row.title,
    company: row.company,
    url: row.url,
    location: row.location ?? undefined,
    remote: row.remote,
    employmentType: (row.employmentType as EmploymentType) ?? undefined,
    seniority: (row.seniority as Seniority) ?? undefined,
    salary: hasSalary
      ? {
          min: row.salaryMin ?? undefined,
          max: row.salaryMax ?? undefined,
          currency: row.salaryCurrency ?? undefined,
          period: row.salaryPeriod ?? undefined,
        }
      : undefined,
    tags: JSON.parse(row.tags) as string[],
    description: row.description,
    postedAt: row.postedAt?.toISOString(),
    retrievedAt: row.retrievedAt.toISOString(),
    applyMode: row.applyMode as ApplyMode,
    rawData: row.rawData ? JSON.parse(row.rawData) : undefined,
  };
}

export class SqlJobStore implements JobStore {
  constructor(private readonly getPool: () => Promise<ConnectionPool>) {}

  async upsertMany(jobs: JobListing[]): Promise<void> {
    const pool = await this.getPool();
    for (const job of jobs) {
      await pool
        .request()
        .input("id", sql.NVarChar, job.id)
        .input("source", sql.NVarChar, job.source)
        .input("sourceJobId", sql.NVarChar, job.sourceJobId)
        .input("title", sql.NVarChar, job.title)
        .input("company", sql.NVarChar, job.company)
        .input("url", sql.NVarChar, job.url)
        .input("location", sql.NVarChar, job.location ?? null)
        .input("remote", sql.Bit, job.remote)
        .input("employmentType", sql.NVarChar, job.employmentType ?? null)
        .input("seniority", sql.NVarChar, job.seniority ?? null)
        .input("salaryMin", sql.Float, job.salary?.min ?? null)
        .input("salaryMax", sql.Float, job.salary?.max ?? null)
        .input("salaryCurrency", sql.NVarChar, job.salary?.currency ?? null)
        .input("salaryPeriod", sql.NVarChar, job.salary?.period ?? null)
        .input("tags", sql.NVarChar, JSON.stringify(job.tags))
        .input("description", sql.NVarChar, job.description)
        .input("postedAt", sql.DateTime2, job.postedAt ? new Date(job.postedAt) : null)
        .input("retrievedAt", sql.DateTime2, new Date(job.retrievedAt))
        .input("applyMode", sql.NVarChar, job.applyMode)
        .input("rawData", sql.NVarChar, job.rawData !== undefined ? JSON.stringify(job.rawData) : null)
        .query(`
          MERGE [dbo].[Job] AS target
          USING (SELECT @id AS id) AS source
          ON target.id = source.id
          WHEN MATCHED THEN UPDATE SET
            title = @title, company = @company, url = @url, location = @location,
            remote = @remote, employmentType = @employmentType, seniority = @seniority,
            salaryMin = @salaryMin, salaryMax = @salaryMax, salaryCurrency = @salaryCurrency,
            salaryPeriod = @salaryPeriod, tags = @tags, description = @description,
            postedAt = @postedAt, retrievedAt = @retrievedAt, applyMode = @applyMode, rawData = @rawData
          WHEN NOT MATCHED THEN INSERT
            (id, source, sourceJobId, title, company, url, location, remote, employmentType, seniority,
             salaryMin, salaryMax, salaryCurrency, salaryPeriod, tags, description, postedAt, retrievedAt,
             applyMode, rawData)
          VALUES
            (@id, @source, @sourceJobId, @title, @company, @url, @location, @remote, @employmentType, @seniority,
             @salaryMin, @salaryMax, @salaryCurrency, @salaryPeriod, @tags, @description, @postedAt, @retrievedAt,
             @applyMode, @rawData);
        `);
    }
  }

  async list(limit = 50): Promise<JobListing[]> {
    const pool = await this.getPool();
    const result: IResult<JobRow> = await pool
      .request()
      .input("limit", sql.Int, limit)
      .query("SELECT TOP (@limit) * FROM [dbo].[Job] ORDER BY retrievedAt DESC");
    return result.recordset.map(rowToJobListing);
  }

  async getById(id: string): Promise<JobListing | undefined> {
    const pool = await this.getPool();
    const result: IResult<JobRow> = await pool
      .request()
      .input("id", sql.NVarChar, id)
      .query("SELECT * FROM [dbo].[Job] WHERE id = @id");
    const row = result.recordset[0];
    return row ? rowToJobListing(row) : undefined;
  }
}
