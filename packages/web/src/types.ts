// Tipos mínimos espejo de @remote-job-hub/core para el dashboard. No se importa el
// paquete core directamente porque arrastra módulos con dependencias de Node
// (node:fs) que no tienen sentido en un bundle de browser.

export interface JobListing {
  id: string;
  source: string;
  title: string;
  company: string;
  url: string;
  location?: string;
  remote: boolean;
  tags: string[];
  description: string;
  postedAt?: string;
  retrievedAt: string;
  applyMode: "external" | "auto" | "assisted";
}

export type ApplicationStatus =
  | "found"
  | "drafted"
  | "submitted"
  | "interviewing"
  | "rejected"
  | "offer"
  | "archived";

export interface Application {
  id: string;
  job: JobListing;
  status: ApplicationStatus;
  cvText?: string;
  coverLetterText?: string;
  createdAt: string;
  updatedAt: string;
  history: { status: ApplicationStatus; at: string }[];
}

export interface SourceInfo {
  id: string;
  name: string;
  capabilities: { search: boolean; applyAuto: boolean; applyAssisted: boolean };
  health: { status: "online" | "degraded" | "offline"; checkedAt: string; message?: string };
}
