export interface DevServer {
  product: string;
  port: number;
  url: string;
}

export const DEV_SERVERS: DevServer[] = [
  { product: "Whitebox",      port: 3000, url: "http://localhost:3000" },
  { product: "FormPilot",     port: 3300, url: "http://localhost:3300" },
  { product: "AgentScore",    port: 3500, url: "http://localhost:3500" },
  { product: "Money Flow",    port: 3100, url: "http://localhost:3100" },
  { product: "Health Credit", port: 3200, url: "http://localhost:3200" },
  { product: "Gym Form Coach",port: 8081, url: "http://localhost:8081" },
];
