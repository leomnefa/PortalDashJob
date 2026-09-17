import { stripHtml } from "@remote-job-hub/core";
import type { Connector, JobListing, SearchQuery } from "@remote-job-hub/core";

interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_required_location?: string;
  tags?: string[];
  description?: string;
  publication_date?: string;
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

const API_BASE = "https://remotive.com/api/remote-jobs";

function mapJob(job: RemotiveJob): JobListing {
  return {
    id: `remotive:${job.id}`,
    source: "remotive",
    title: job.title,
    company: job.company_name,
    url: job.url,
    location: job.candidate_required_location,
    remote: true,
    tags: job.tags ?? [],
    description: job.description ? stripHtml(job.description) : "",
    postedAt: job.publication_date,
    applyMode: "external",
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
  };
}
