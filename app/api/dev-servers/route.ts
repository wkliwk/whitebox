import { NextResponse } from "next/server";
import { DEV_SERVERS } from "@/lib/dev-servers";

export const dynamic = "force-dynamic";

interface ServerStatus {
  product: string;
  port: number;
  url: string;
  alive: boolean;
}

async function checkPort(url: string): Promise<boolean> {
  try {
    await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(1500),
    });
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const results = await Promise.all(
    DEV_SERVERS.map(async (s): Promise<ServerStatus> => {
      const alive = await checkPort(s.url);
      return { product: s.product, port: s.port, url: s.url, alive };
    })
  );

  return NextResponse.json({ servers: results });
}
