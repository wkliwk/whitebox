export interface McpServer {
  name: string;
  source: "global" | "project";
  type: "stdio" | "sse";
  command: string;
  args: string[];
  env: Record<string, string>;
  /** true if a matching process is currently running */
  running: boolean;
}

export interface InstalledPlugin {
  id: string;
  name: string;
  marketplace: string;
  version: string;
  scope: string;
  installedAt: string;
  lastUpdated: string;
}
