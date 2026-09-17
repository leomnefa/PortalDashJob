import type { ExperienceEntry, JobListing, Profile } from "./types.js";
import { extractKeywords, scoreTextAgainstKeywords } from "./keywords.js";

function jobKeywords(job: JobListing): string[] {
  return extractKeywords([job.title, job.tags.join(" "), job.description].join(" "));
}

function rankedSkills(profile: Profile, keywords: string[]): string[] {
  return [...profile.skills].sort(
    (a, b) => scoreTextAgainstKeywords(b, keywords) - scoreTextAgainstKeywords(a, keywords),
  );
}

function rankedExperience(profile: Profile, keywords: string[]): ExperienceEntry[] {
  return profile.experience
    .map((entry) => ({
      entry,
      bullets: [...entry.bullets].sort(
        (a, b) => scoreTextAgainstKeywords(b, keywords) - scoreTextAgainstKeywords(a, keywords),
      ),
      score: entry.bullets.reduce((s, b) => s + scoreTextAgainstKeywords(b, keywords), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ entry, bullets }) => ({ ...entry, bullets }));
}

export function generateTailoredCv(profile: Profile, job: JobListing): string {
  const keywords = jobKeywords(job);
  const skills = rankedSkills(profile, keywords);
  const experience = rankedExperience(profile, keywords);

  const lines: string[] = [];
  lines.push(`# ${profile.fullName}`);
  const contact = [profile.email, profile.phone, profile.location].filter(Boolean).join(" · ");
  if (contact) lines.push(contact);
  const links = Object.entries(profile.links).map(([label, url]) => `${label}: ${url}`);
  if (links.length) lines.push(links.join(" · "));
  lines.push("");
  lines.push(`## Resumen`);
  lines.push(`${profile.summary} Postulación orientada a **${job.title}** en **${job.company}**.`);
  lines.push("");
  lines.push(`## Habilidades`);
  lines.push(skills.join(", "));
  lines.push("");
  lines.push(`## Experiencia`);
  for (const entry of experience) {
    lines.push(`**${entry.role}** — ${entry.company} (${entry.startDate} – ${entry.endDate ?? "presente"})`);
    for (const bullet of entry.bullets) lines.push(`- ${bullet}`);
    lines.push("");
  }
  if (profile.education.length) {
    lines.push(`## Educación`);
    for (const edu of profile.education) {
      lines.push(`${edu.degree} — ${edu.institution} (${edu.startDate} – ${edu.endDate ?? "presente"})`);
    }
    lines.push("");
  }
  if (profile.languages.length) {
    lines.push(`## Idiomas`);
    lines.push(profile.languages.join(", "));
  }
  return lines.join("\n").trim() + "\n";
}

export function generateCoverLetter(profile: Profile, job: JobListing): string {
  const keywords = jobKeywords(job);
  const topSkills = rankedSkills(profile, keywords).slice(0, 3);
  const topExperience = rankedExperience(profile, keywords)[0];

  const highlight = topExperience
    ? `En mi rol como ${topExperience.role} en ${topExperience.company}, ${
        topExperience.bullets[0]?.toLowerCase() ?? "trabajé en proyectos afines a este puesto"
      }.`
    : "";

  return [
    `Hola equipo de ${job.company},`,
    "",
    `Les escribo para postularme a la posición de ${job.title}. ${profile.summary}`,
    "",
    highlight,
    "",
    `Mis principales fortalezas para este rol son ${topSkills.join(", ")}.`,
    "",
    "Quedo a disposición para conversar sobre cómo puedo aportar al equipo.",
    "",
    "Saludos,",
    profile.fullName,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
