import { NextResponse } from "next/server";
import { getSessionHistory } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const sessions = await getSessionHistory();
  return NextResponse.json({ sessions, updatedAt: new Date().toISOString() });
}
