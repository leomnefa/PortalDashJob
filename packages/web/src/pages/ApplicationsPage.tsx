import { useEffect, useState } from "react";
import { listApplications, updateApplicationStatus } from "../api";
import type { Application, ApplicationStatus } from "../types";

const STATUSES: ApplicationStatus[] = [
  "found",
  "drafted",
  "submitted",
  "interviewing",
  "rejected",
  "offer",
  "archived",
];

export function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await listApplications();
      setApplications(result.applications);
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    try {
      await updateApplicationStatus(id, status);
      await load();
    } catch (err) {
      setMessage((err as Error).message);
    }
  }

  if (loading) return <p>Cargando...</p>;

  return (
    <section>
      {message && <p className="message">{message}</p>}
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>Puesto</th>
            <th>Fuente</th>
            <th>Estado</th>
            <th>Actualizada</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.job.company}</td>
              <td>
                <a href={app.job.url} target="_blank" rel="noreferrer">
                  {app.job.title}
                </a>
              </td>
              <td>{app.job.source}</td>
              <td>
                <select value={app.status} onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
              <td>{new Date(app.updatedAt).toLocaleString()}</td>
            </tr>
          ))}
          {!applications.length && (
            <tr>
              <td colSpan={5}>Todavía no hay postulaciones. Preparalas desde Búsqueda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
