import { stripHtml } from "@remote-job-hub/core";
import type { Connector, ConnectorHealth, EmploymentType, JobListing, SearchQuery } from "@remote-job-hub/core";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  job_type?: string;
  tags?: string[];
  description?: string;
  publication_date?: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

const API_BASE = "https://remotive.com/api/remote-jobs";

const EMPLOYMENT_TYPE_MAP: Record<string, EmploymentType> = {
  full_time: "full_time",
  part_time: "part_time",
  contract: "contract",
  freelance: "freelance",
  internship: "internship",
};

function mapJob(job: RemotiveJob): JobListing {
  return {
    id: `remotive:${job.id}`,
    source: "remotive",
    sourceJobId: String(job.id),
    title: job.title,
    company: job.company_name,
    url: job.url,
    location: job.candidate_required_location,
    remote: true,
    employmentType: job.job_type ? EMPLOYMENT_TYPE_MAP[job.job_type] : undefined,
    tags: job.tags ?? [],
    description: job.description ? stripHtml(job.description) : "",
    postedAt: job.publication_date,
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    rawData: job,
  };
}

export interface RemotiveConnectorOptions {
  fetchImpl?: typeof fetch;
}

export function createRemotiveConnector(opts: RemotiveConnectorOptions = {}): Connector {
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    id: "remotive",
    name: "Remotive",
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search(query: SearchQuery): Promise<JobListing[]> {
      const url = new URL(API_BASE);
      if (query.keywords?.length) url.searchParams.set("search", query.keywords.join(" "));
      if (query.limit) url.searchParams.set("limit", String(query.limit));

      const res = await fetchImpl(url.toString());
      if (!res.ok) {
        throw new Error(`Remotive API respondió ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as RemotiveResponse;
      return data.jobs.map(mapJob);
    },
    async healthCheck(): Promise<ConnectorHealth> {
      const checkedAt = new Date().toISOString();
      try {
        const res = await fetchImpl(`${API_BASE}?limit=1`);
        return res.ok
          ? { status: "online", checkedAt }
          : { status: "degraded", checkedAt, message: `HTTP ${res.status}` };
      } catch (err) {
        return { status: "offline", checkedAt, message: (err as Error).message };
      }
    },
  };
}
