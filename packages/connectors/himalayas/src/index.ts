import { extractKeywords, stripHtml } from "@remote-job-hub/core";
import type { Connector, ConnectorHealth, JobListing, SearchQuery } from "@remote-job-hub/core";

interface HimalayasJob {
  guid: string;
  title: string;
  companyName: string;
  applicationLink: string;
  locationRestrictions?: string[];
  categories?: string[];
  description?: string;
  excerpt?: string;
  pubDate?: number;
}

interface HimalayasResponse {
  jobs: HimalayasJob[];
}

const API_BASE = "https://himalayas.app/api/jobs";

function mapJob(job: HimalayasJob): JobListing {
  const description = job.description ?? job.excerpt ?? "";
  return {
    id: `himalayas:${job.guid}`,
    source: "himalayas",
    sourceJobId: job.guid,
    title: job.title,
    company: job.companyName,
    url: job.applicationLink,
    location: job.locationRestrictions?.join(", ") || "Worldwide",
    remote: true,
    tags: job.categories ?? [],
    description: stripHtml(description),
    postedAt: job.pubDate ? new Date(job.pubDate * 1000).toISOString() : undefined,
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    rawData: job,
  };
}

function matchesKeywords(job: JobListing, keywords: string[]): boolean {
  if (!keywords.length) return true;
  const haystack = extractKeywords([job.title, job.tags.join(" "), job.description].join(" "));
  return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

export interface HimalayasConnectorOptions {
  fetchImpl?: typeof fetch;
}

export function createHimalayasConnector(opts: HimalayasConnectorOptions = {}): Connector {
  const fetchImpl = opts.fetchImpl ?? fetch;

  return {
    id: "himalayas",
    name: "Himalayas",
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search(query: SearchQuery): Promise<JobListing[]> {
      const url = new URL(API_BASE);
      url.searchParams.set("limit", String(query.limit ?? 20));
      if (query.keywords?.length) url.searchParams.set("search", query.keywords.join(" "));

      const res = await fetchImpl(url.toString());
      if (!res.ok) {
        throw new Error(`Himalayas API respondió ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as HimalayasResponse;
      const jobs = data.jobs.map(mapJob);

      // La API pública no documenta de forma confiable el filtrado server-side por
      // keyword, así que filtramos client-side como red de seguridad.
      return jobs.filter((job) => matchesKeywords(job, query.keywords ?? []));
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
