import { filterByKeywords, stripHtml } from "@remote-job-hub/core";
import type { Connector, ConnectorHealth, JobListing, SearchQuery } from "@remote-job-hub/core";

interface RemoteOkEntry {
  id?: string | number;
  slug?: string;
  company?: string;
  position?: string;
  tags?: string[];
  description?: string;
  location?: string;
  url?: string;
  date?: string;
  salary_min?: number;
  salary_max?: number;
  legal?: string;
}

const API_BASE = "https://remoteok.com/api";

// RemoteOK bloquea clientes sin un User-Agent identificable — no es una API key,
// pero sin esto suele responder 403.
const USER_AGENT = "remote-job-hub (+https://github.com/vallejo-sanjuan/remote-job-hub)";

function isJobEntry(entry: RemoteOkEntry): boolean {
  // El primer elemento del array es un aviso legal sin id de oferta — nunca un job real.
  return entry.id !== undefined && entry.position !== undefined;
}

function mapJob(job: RemoteOkEntry): JobListing {
  const hasSalary = Boolean(job.salary_min || job.salary_max);
  return {
    id: `remoteok:${job.id}`,
    source: "remoteok",
    sourceJobId: String(job.id),
    title: job.position ?? "",
    company: job.company ?? "",
    url: job.url ?? `https://remoteok.com/remote-jobs/${job.slug ?? job.id}`,
    location: job.location || undefined,
    remote: true,
    salary: hasSalary
      ? { min: job.salary_min || undefined, max: job.salary_max || undefined, currency: "USD" }
      : undefined,
    tags: job.tags ?? [],
    description: job.description ? stripHtml(job.description) : "",
    postedAt: job.date,
    retrievedAt: new Date().toISOString(),
    applyMode: "external",
    rawData: job,
  };
}

export interface RemoteOkConnectorOptions {
  fetchImpl?: typeof fetch;
}

export function createRemoteOkConnector(opts: RemoteOkConnectorOptions = {}): Connector {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = { "User-Agent": USER_AGENT };

  return {
    id: "remoteok",
    name: "Remote OK",
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search(query: SearchQuery): Promise<JobListing[]> {
      // Sin parámetro de búsqueda server-side documentado: se trae el feed completo
      // y se filtra client-side (ver filterByKeywords).
      const res = await fetchImpl(API_BASE, { headers });
      if (!res.ok) {
        throw new Error(`Remote OK API respondió ${res.status}: ${res.statusText}`);
      }
      const data = (await res.json()) as RemoteOkEntry[];
      const jobs = data.filter(isJobEntry).map(mapJob);
      const filtered = filterByKeywords(jobs, query.keywords ?? []);
      return query.limit ? filtered.slice(0, query.limit) : filtered;
    },
    async healthCheck(): Promise<ConnectorHealth> {
      const checkedAt = new Date().toISOString();
      try {
        const res = await fetchImpl(API_BASE, { headers });
        return res.ok
          ? { status: "online", checkedAt }
          : { status: "degraded", checkedAt, message: `HTTP ${res.status}` };
      } catch (err) {
        return { status: "offline", checkedAt, message: (err as Error).message };
      }
    },
  };
}
