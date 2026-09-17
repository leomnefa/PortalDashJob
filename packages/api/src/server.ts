import path from "node:path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { ensureDb, REPO_ROOT } from "./context.js";
import { registerJobRoutes } from "./routes/jobs.js";
import { registerSourceRoutes } from "./routes/sources.js";
import { registerApplicationRoutes } from "./routes/applications.js";

try {
  process.loadEnvFile(path.join(REPO_ROOT, ".env"));
} catch {
  // Sin .env, ensureDb() más abajo va a fallar con un mensaje claro.
}

async function main(): Promise<void> {
  await ensureDb();

  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  await registerJobRoutes(app);
  await registerSourceRoutes(app);
  await registerApplicationRoutes(app);

  app.get("/api/health", async () => ({ status: "ok" }));

  const port = Number(process.env.PORT ?? 3100);
  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
