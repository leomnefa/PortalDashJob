import { describe, expect, it } from "vitest";
import { generateTailoredCv, generateCoverLetter } from "../src/cv-generator.js";
import type { JobListing, Profile } from "../src/types.js";

const profile: Profile = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  location: "Remote",
  links: {},
  summary: "Ingeniera backend con foco en sistemas distribuidos.",
  targetRoles: ["Backend Engineer"],
  skills: ["Python", "Node.js", "Kubernetes", "Excel"],
  languages: ["Español", "Inglés"],
  experience: [
    {
      company: "Acme",
      role: "Backend Engineer",
      startDate: "2020",
      endDate: null,
      bullets: [
        "Diseñé pipelines de datos en Python y Airflow",
        "Armé reportes en Excel para el equipo comercial",
        "Optimicé consultas SQL de alto volumen",
      ],
    },
  ],
  education: [],
};

const job: JobListing = {
  id: "job-1",
  source: "test",
  sourceJobId: "1",
  title: "Senior Python Backend Engineer",
  company: "RemoteCo",
  url: "https://example.com/job-1",
  remote: true,
  tags: ["python", "backend", "sql"],
  description: "Buscamos alguien con experiencia en Python, SQL y sistemas distribuidos.",
  retrievedAt: "2026-09-17T00:00:00.000Z",
  applyMode: "external",
};

describe("generateTailoredCv", () => {
  it("prioriza skills que matchean con el job por sobre las que no", () => {
    const cv = generateTailoredCv(profile, job);
    const lines = cv.split("\n");
    const skillsLine = lines[lines.indexOf("## Habilidades") + 1];
    expect(skillsLine.indexOf("Python")).toBeLessThan(skillsLine.indexOf("Excel"));
  });

  it("reordena los bullets de experiencia según relevancia", () => {
    const cv = generateTailoredCv(profile, job);
    const sqlIdx = cv.indexOf("consultas SQL");
    const excelIdx = cv.indexOf("reportes en Excel");
    expect(sqlIdx).toBeLessThan(excelIdx);
  });

  it("incluye el título y la empresa del listing", () => {
    const cv = generateTailoredCv(profile, job);
    expect(cv).toContain(job.title);
    expect(cv).toContain(job.company);
  });
});

describe("generateCoverLetter", () => {
  it("menciona la empresa y el rol", () => {
    const letter = generateCoverLetter(profile, job);
    expect(letter).toContain(job.company);
    expect(letter).toContain(job.title);
  });
});
