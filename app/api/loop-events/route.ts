import { NextResponse } from "next/server";
import { getLoopEvents } from "@/lib/redis";

export const revalidate = 10;

export async function GET() {
  const events = await getLoopEvents(30);
  return NextResponse.json(events, {
    headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5" },
  });
}
