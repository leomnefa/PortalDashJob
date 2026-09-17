import { useState } from "react";
import { prepareApplication, searchJobs } from "../api";
import type { JobListing } from "../types";

export function SearchPage() {
  const [keywords, setKeywords] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [errors, setErrors] = useState<{ connectorId: string; message: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [preparing, setPreparing] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const result = await searchJobs(
        keywords.split(",").map((k) => k.trim()).filter(Boolean),
        20,
      );
      setJobs(result.jobs);
      setErrors(result.errors);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePrepare(job: JobListing) {
    setPreparing(job.id);
    setMessage(null);
    try {
      await prepareApplication(job.id);
      setMessage(`Postulación preparada para "${job.title}" — ${job.company}. Revisala en Postulaciones.`);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setPreparing(null);
    }
  }

  return (
    <section>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Keywords separadas por coma (ej: backend, node)"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}
      {errors.length > 0 && (
        <ul className="errors">
          {errors.map((e) => (
            <li key={e.connectorId}>
              [{e.connectorId}] {e.message}
            </li>
          ))}
        </ul>
      )}

      <table>
        <thead>
          <tr>
            <th>Título</th>
            <th>Empresa</th>
            <th>Fuente</th>
            <th>Ubicación</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id}>
              <td>
                <a href={job.url} target="_blank" rel="noreferrer">
                  {job.title}
                </a>
              </td>
              <td>{job.company}</td>
              <td>{job.source}</td>
              <td>{job.location ?? "Remoto"}</td>
              <td>
                <button onClick={() => handlePrepare(job)} disabled={preparing === job.id}>
                  {preparing === job.id ? "Preparando..." : "Preparar postulación"}
                </button>
              </td>
            </tr>
          ))}
          {!jobs.length && !loading && (
            <tr>
              <td colSpan={5}>Sin resultados todavía. Probá una búsqueda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
