// Simula el subconjunto de mssql que usan job-repository/application-repository,
// interpretando las consultas reales (no solo verificando que se llamaron) para
// poder probar upsert/dedup y el flujo de postulaciones sin una SQL Server real.
export function createFakePool() {
  const jobs = new Map<string, Record<string, unknown>>();
  const applications = new Map<string, Record<string, unknown>>();
  const events: { applicationId: string; status: string; at: Date }[] = [];

  function makeRequest() {
    const inputs: Record<string, unknown> = {};
    const request = {
      input(name: string, _type: unknown, value: unknown) {
        inputs[name] = value;
        return request;
      },
      async query<T = Record<string, unknown>>(sqlText: string): Promise<{ recordset: T[]; rowsAffected: number[] }> {
        const text = sqlText.replace(/\s+/g, " ").trim();

        if (text.includes("MERGE [dbo].[Job]")) {
          jobs.set(inputs.id as string, { ...inputs });
          return { recordset: [], rowsAffected: [1] };
        }
        if (text.includes("TOP (@limit) * FROM [dbo].[Job]")) {
          const all = [...jobs.values()].sort(
            (a, b) => (b.retrievedAt as Date).getTime() - (a.retrievedAt as Date).getTime(),
          );
          return { recordset: all.slice(0, inputs.limit as number) as T[], rowsAffected: [] };
        }
        if (text.includes("FROM [dbo].[Job] WHERE id = @id")) {
          const row = jobs.get(inputs.id as string);
          return { recordset: (row ? [row] : []) as T[], rowsAffected: [] };
        }
        if (text.includes("FROM [dbo].[ApplicationEvent] WHERE applicationId")) {
          const rows = events
            .filter((e) => e.applicationId === inputs.applicationId)
            .sort((a, b) => a.at.getTime() - b.at.getTime());
          return { recordset: rows as unknown as T[], rowsAffected: [] };
        }
        if (text.includes("FROM [dbo].[Application] WHERE jobId")) {
          const matches = [...applications.values()]
            .filter((a) => a.jobId === inputs.jobId)
            .sort((a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime());
          return { recordset: matches.slice(0, 1) as T[], rowsAffected: [] };
        }
        if (text.includes("FROM [dbo].[Application] WHERE id = @id")) {
          const row = applications.get(inputs.id as string);
          return { recordset: (row ? [row] : []) as T[], rowsAffected: [] };
        }
        if (text.startsWith("SELECT * FROM [dbo].[Application] ORDER BY")) {
          const all = [...applications.values()].sort(
            (a, b) => (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime(),
          );
          return { recordset: all as T[], rowsAffected: [] };
        }
        if (text.startsWith("INSERT INTO [dbo].[Application] (")) {
          applications.set(inputs.id as string, {
            id: inputs.id,
            jobId: inputs.jobId,
            status: inputs.status,
            cvText: inputs.cvText,
            coverLetterText: inputs.coverLetterText,
            notes: null,
            createdAt: inputs.createdAt,
            updatedAt: inputs.updatedAt,
          });
          return { recordset: [], rowsAffected: [1] };
        }
        if (text.startsWith("UPDATE [dbo].[Application] SET status")) {
          const app = applications.get(inputs.id as string);
          if (!app) return { recordset: [], rowsAffected: [0] };
          app.status = inputs.status;
          app.updatedAt = inputs.updatedAt;
          return { recordset: [], rowsAffected: [1] };
        }
        if (text.startsWith("INSERT INTO [dbo].[ApplicationEvent]")) {
          events.push({
            applicationId: inputs.applicationId as string,
            status: inputs.status as string,
            at: inputs.at as Date,
          });
          return { recordset: [], rowsAffected: [1] };
        }
        throw new Error(`fake-pool: consulta no reconocida: ${text.slice(0, 120)}`);
      },
    };
    return request;
  }

  return { getPool: async () => ({ request: () => makeRequest() }) as never, jobs, applications, events };
}
