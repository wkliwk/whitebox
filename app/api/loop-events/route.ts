import { NextRequest, NextResponse } from "next/server";
import { getLoopEvents } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const offset = Math.max(0, parseInt(searchParams.get("offset") ?? "0", 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10) || 50));

  const result = await getLoopEvents(limit, offset);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5" },
  });
}
