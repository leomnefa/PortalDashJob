import { describe, expect, it } from "vitest";
import { ConnectorRegistry } from "../src/registry.js";
import type { Connector } from "../src/types.js";

function fakeConnector(id: string, healthy: boolean): Connector {
  return {
    id,
    name: id,
    capabilities: { search: true, applyAuto: false, applyAssisted: false },
    async search() {
      return [];
    },
    async healthCheck() {
      return healthy
        ? { status: "online", checkedAt: new Date().toISOString() }
        : { status: "offline", checkedAt: new Date().toISOString(), message: "down" };
    },
  };
}

describe("ConnectorRegistry", () => {
  it("registra y lista conectores", () => {
    const registry = new ConnectorRegistry();
    registry.register(fakeConnector("a", true));
    registry.register(fakeConnector("b", true));
    expect(registry.list().map((c) => c.id)).toEqual(["a", "b"]);
    expect(registry.get("a")?.id).toBe("a");
  });

  it("rechaza ids duplicados", () => {
    const registry = new ConnectorRegistry();
    registry.register(fakeConnector("a", true));
    expect(() => registry.register(fakeConnector("a", true))).toThrow();
  });

  it("aísla el health check de cada conector", async () => {
    const registry = new ConnectorRegistry();
    registry.register(fakeConnector("ok", true));
    registry.register(fakeConnector("caido", false));
    const health = await registry.healthCheckAll();
    expect(health.ok.status).toBe("online");
    expect(health.caido.status).toBe("offline");
  });
});
