import type { JobListing } from "./types.js";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "this", "that", "from", "into", "who", "what", "job", "role", "team",
  "work", "experience", "years", "year", "a", "an", "of", "to", "in", "on",
  "is", "we", "as", "be", "or", "at", "by", "it", "their", "they",
]);

export function extractKeywords(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .split(/\s+/)
    // Sacar puntuación pegada a los bordes (ej: "sql." de fin de oración) sin
    // tocar caracteres internos que sí importan (node.js, c#, c++).
    .map((t) => t.replace(/^[.\-]+|[.\-]+$/g, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

export function scoreTextAgainstKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => (lower.includes(kw) ? score + 1 : score), 0);
}

/**
 * Red de seguridad para conectores cuya API no confirma soporte de búsqueda
 * server-side por keyword (o solo filtra por un tag/categoría, no full-text):
 * filtra client-side sobre título+tags+descripción antes de devolver resultados.
 */
export function filterByKeywords(jobs: JobListing[], keywords: string[]): JobListing[] {
  if (!keywords.length) return jobs;
  return jobs.filter((job) => {
    const haystack = extractKeywords([job.title, job.tags.join(" "), job.description].join(" "));
    return keywords.some((kw) => haystack.includes(kw.toLowerCase()));
  });
}
