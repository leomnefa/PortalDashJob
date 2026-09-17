import type { FastifyInstance } from "fastify";
import { getRegistry } from "../context.js";

export async function registerSourceRoutes(app: FastifyInstance): Promise<void> {
  const registry = getRegistry();

  app.get("/api/sources", async () => {
    const health = await registry.healthCheckAll();
    return {
      sources: registry.list().map((c) => ({
        id: c.id,
        name: c.name,
        capabilities: c.capabilities,
        health: health[c.id],
      })),
    };
  });
}
