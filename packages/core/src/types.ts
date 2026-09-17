import { z } from "zod";

export const ExperienceEntrySchema = z.object({
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  bullets: z.array(z.string()),
});
export type ExperienceEntry = z.infer<typeof ExperienceEntrySchema>;

export const EducationEntrySchema = z.object({
  institution: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
});
export type EducationEntry = z.infer<typeof EducationEntrySchema>;

export const ProfileSchema = z.object({
  fullName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  location: z.string().optional(),
  links: z.record(z.string(), z.string()).default({}),
  summary: z.string(),
  targetRoles: z.array(z.string()).default([]),
  skills: z.array(z.string()),
  languages: z.array(z.string()).default([]),
  experience: z.array(ExperienceEntrySchema),
  education: z.array(EducationEntrySchema).default([]),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ApplyModeSchema = z.enum(["external", "auto", "assisted"]);
export type ApplyMode = z.infer<typeof ApplyModeSchema>;

export const EmploymentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "temporary",
  "internship",
  "unknown",
]);
export type EmploymentType = z.infer<typeof EmploymentTypeSchema>;

export const SenioritySchema = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "lead",
  "manager",
  "unknown",
]);
export type Seniority = z.infer<typeof SenioritySchema>;

export const SalarySchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  currency: z.string().optional(),
  period: z.string().optional(),
});
export type Salary = z.infer<typeof SalarySchema>;

// Campos que ninguna fuente confirma todavía (employmentType/seniority/salary
// estructurado) quedan optional y sin valor: no se inventan a partir de texto
// libre. Se completan conector por conector a medida que la fuente los dé con
// certeza (ver docs/integrations/*.md).
export const JobListingSchema = z.object({
  id: z.string(),
  source: z.string(),
  sourceJobId: z.string(),
  title: z.string(),
  company: z.string(),
  url: z.string(),
  location: z.string().optional(),
  remote: z.boolean(),
  employmentType: EmploymentTypeSchema.optional(),
  seniority: SenioritySchema.optional(),
  salary: SalarySchema.optional(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  postedAt: z.string().optional(),
  retrievedAt: z.string(),
  applyMode: ApplyModeSchema,
  rawData: z.unknown().optional(),
});
export type JobListing = z.infer<typeof JobListingSchema>;

export interface ConnectorCapabilities {
  search: boolean;
  applyAuto: boolean;
  applyAssisted: boolean;
}

export interface ConnectorHealth {
  status: "online" | "degraded" | "offline";
  checkedAt: string;
  message?: string;
}

export interface SearchQuery {
  keywords?: string[];
  remoteOnly?: boolean;
  limit?: number;
}

export interface Connector {
  id: string;
  name: string;
  capabilities: ConnectorCapabilities;
  search(query: SearchQuery): Promise<JobListing[]>;
  /** Solo si capabilities.search lo justifica; no todas las fuentes exponen "get by id". */
  getJob?(sourceJobId: string): Promise<JobListing | undefined>;
  /** Requiere capabilities.applyAuto — no implementar salvo que la API lo soporte de verdad. */
  submitApplication?(sourceJobId: string, application: { cvText: string; coverLetterText?: string }): Promise<{ externalApplicationId?: string }>;
  healthCheck(): Promise<ConnectorHealth>;
}

export const ApplicationStatusSchema = z.enum([
  "found",
  "drafted",
  "submitted",
  "interviewing",
  "rejected",
  "offer",
  "archived",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

export const ApplicationSchema = z.object({
  id: z.string(),
  job: JobListingSchema,
  status: ApplicationStatusSchema,
  cvText: z.string().optional(),
  coverLetterText: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(z.object({ status: ApplicationStatusSchema, at: z.string() })),
});
export type Application = z.infer<typeof ApplicationSchema>;

/**
 * Contrato de persistencia de postulaciones. `JsonApplicationStore` (JSON local,
 * zero-config) y `SqlApplicationStore` (packages/db, SQL Server) son las dos
 * implementaciones — CLI y API eligen una u otra según haya DB configurada.
 */
export interface ApplicationStore {
  list(): Promise<Application[]>;
  findByJobId(jobId: string): Promise<Application | undefined>;
  create(job: JobListing, opts?: { cvText?: string; coverLetterText?: string }): Promise<Application>;
  updateStatus(id: string, status: ApplicationStatus): Promise<Application>;
}

/** Contrato de persistencia de ofertas normalizadas, con upsert deduplicado por id (source:sourceJobId). */
export interface JobStore {
  upsertMany(jobs: JobListing[]): Promise<void>;
  list(limit?: number): Promise<JobListing[]>;
  getById(id: string): Promise<JobListing | undefined>;
}
