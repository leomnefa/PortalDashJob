import { filterByKeywords, stripHtml } from "@remote-job-hub/core";
import type { Connector, ConnectorHealth, EmploymentType, JobListing, SearchQuery } from "@remote-job-hub/core";

interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  jobIndustry?: string[];
  jobType?: string[];
  jobGeo?: string;
  jobExcerpt?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number | null;
  annualSalaryMax?: number | null;
  salaryCurrency?: string | null;
}

interface JobicyResponse {
  jobs: JobicyJob[];
}

const API_BASE = "https://jobicy.com/api/v2/remote-jobs";

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  "full-time": "full_time",
  "part-time": "part_time",
  contract: "contract",
  freelance: "freelance",
  internship: "internship",
};

function parseDate(value?: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapJob(job: JobicyJob): JobListing {
  const hasSalary = job.annualSalaryMin != null || job.annualSalaryMax != null;
  return {
    id: `jobicy:${job.id}`,
    source: "jobicy",
    sourceJobId: String(job.id),
    title: job.jobTitle,
    company: job.companyName,
    url: job.url,
    location: job.jobGeo || "Worldwide",
    remote: true,
    employmentType: job.jobType?.[0] ? EMPLOYMENT_TYPE_MAP[job.jobType[0].toLowerCase()] : undefined,
    salary: hasSalary
      ? {
          min: job.annualSalaryMin ?? undefined,
          max: job.annualSalaryMax ?? undefined,
          currency: job.salaryCurrency ?? undefined,
          period: "year",
        }
      : undefined,
    tags: job.jobIndustry ?? [],
    description: stripHtml(job.jobDescription ?? job.jobExcerpt ?? ""),
    postedAt: parseDate(job.pubDate),
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    rawData: job,
  };
}

export interface JobicyConnectorOptions {
  fetchImpl?: typeof fetch;
}

export function createJobicyConnector(opts: JobicyConnectorOptions = {}): Connector {
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    id: "jobicy",
    name: "Jobicy",
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search(query: SearchQuery): Promise<JobListing[]> {
      const url = new URL(API_BASE);
      if (query.limit) url.searchParams.set("count", String(query.limit));
      // `tag` filtra por una única categoría/tag, no es full-text search — se pasa
      // como mejor esfuerzo con la primera keyword y de todas formas se filtra
      // client-side abajo (no se confirmó el comportamiento exacto contra la doc viva).
      if (query.keywords?.[0]) url.searchParams.set("tag", query.keywords[0]);

      const res = await fetchImpl(url.toString());
      if (!res.ok) {
        throw new Error(`Jobicy API respondió ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as JobicyResponse;
      const jobs = data.jobs.map(mapJob);
      return filterByKeywords(jobs, query.keywords ?? []);
    },
    async healthCheck(): Promise<ConnectorHealth> {
      const checkedAt = new Date().toISOString();
      try {
        const res = await fetchImpl(`${API_BASE}?count=1`);
        return res.ok
          ? { status: "online", checkedAt }
          : { status: "degraded", checkedAt, message: `HTTP ${res.status}` };
      } catch (err) {
        return { status: "offline", checkedAt, message: (err as Error).message };
      }
    },
  };
}
