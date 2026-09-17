import type { Connector, ConnectorHealth } from "./types.js";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, Connector>();

  register(connector: Connector): void {
    if (this.connectors.has(connector.id)) {
      throw new Error(`Ya hay un conector registrado con id "${connector.id}"`);
    }
    this.connectors.set(connector.id, connector);
  }

  get(id: string): Connector | undefined {
    return this.connectors.get(id);
  }

  list(): Connector[] {
    return Array.from(this.connectors.values());
  }

  async healthCheckAll(): Promise<Record<string, ConnectorHealth>> {
    const entries = await Promise.all(
      this.list().map(async (connector) => [connector.id, await connector.healthCheck()] as const),
    );
    return Object.fromEntries(entries);
  }
}
