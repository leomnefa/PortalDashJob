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

export const JobListingSchema = z.object({
  id: z.string(),
  source: z.string(),
  title: z.string(),
  company: z.string(),
  url: z.string(),
  location: z.string().optional(),
  remote: z.boolean(),
  tags: z.array(z.string()).default([]),
  description: z.string().default(""),
  postedAt: z.string().optional(),
  applyMode: ApplyModeSchema,
});
export type JobListing = z.infer<typeof JobListingSchema>;

export interface ConnectorCapabilities {
  search: boolean;
  applyAuto: boolean;
  applyAssisted: boolean;
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
