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
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  return Array.from(new Set(tokens));
}

export function scoreTextAgainstKeywords(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.reduce((score, kw) => (lower.includes(kw) ? score + 1 : score), 0);
}
