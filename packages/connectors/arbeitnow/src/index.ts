import { filterByKeywords, stripHtml } from "@remote-job-hub/core";
import type { Connector, ConnectorHealth, EmploymentType, JobListing, SearchQuery } from "@remote-job-hub/core";

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description?: string;
  remote: boolean;
  url: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

const API_BASE = "https://www.arbeitnow.com/api/job-board-api";

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  full_time: "full_time",
  part_time: "part_time",
  contract: "contract",
  internship: "internship",
};

function mapJob(job: ArbeitnowJob): JobListing {
  return {
    id: `arbeitnow:${job.slug}`,
    source: "arbeitnow",
    sourceJobId: job.slug,
    title: job.title,
    company: job.company_name,
    url: job.url,
    location: job.location || undefined,
    remote: job.remote,
    employmentType: job.job_types?.[0] ? EMPLOYMENT_TYPE_MAP[job.job_types[0]] : undefined,
    tags: job.tags ?? [],
    description: job.description ? stripHtml(job.description) : "",
    postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined,
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    rawData: job,
  };
}

export interface ArbeitnowConnectorOptions {
  fetchImpl?: typeof fetch;
}

export function createArbeitnowConnector(opts: ArbeitnowConnectorOptions = {}): Connector {
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    id: "arbeitnow",
    name: "Arbeitnow",
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search(query: SearchQuery): Promise<JobListing[]> {
      // La API no documenta un parámetro de búsqueda por keyword server-side —
      // solo pagina el feed completo, más reciente primero — así que traemos la
      // primera página y filtramos client-side (ver filterByKeywords).
      const res = await fetchImpl(API_BASE);
      if (!res.ok) {
        throw new Error(`Arbeitnow API respondió ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as ArbeitnowResponse;
      const jobs = data.data.map(mapJob);
      const filtered = filterByKeywords(jobs, query.keywords ?? []);
      return query.limit ? filtered.slice(0, query.limit) : filtered;
    },
    async healthCheck(): Promise<ConnectorHealth> {
      const checkedAt = new Date().toISOString();
      try {
        const res = await fetchImpl(API_BASE);
        return res.ok
          ? { status: "online", checkedAt }
          : { status: "degraded", checkedAt, message: `HTTP ${res.status}` };
      } catch (err) {
        return { status: "offline", checkedAt, message: (err as Error).message };
      }
    },
  };
}
