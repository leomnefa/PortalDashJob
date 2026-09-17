import type { Application, ApplicationStatus, JobListing, SourceInfo } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export function searchJobs(keywords: string[], limit = 20) {
  return request<{ jobs: JobListing[]; errors: { connectorId: string; message: string }[] }>("/jobs/search", {
    method: "POST",
    body: JSON.stringify({ keywords, limit }),
  });
}

export function listSources() {
  return request<{ sources: SourceInfo[] }>("/sources");
}

export function listApplications() {
  return request<{ applications: Application[] }>("/applications");
}

export function prepareApplication(jobId: string) {
  return request<{ application: Application }>("/applications", {
    method: "POST",
    body: JSON.stringify({ jobId }),
  });
}

export function updateApplicationStatus(id: string, status: ApplicationStatus) {
  return request<{ application: Application }>(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
