import { NextResponse } from "next/server";
import { getTokenUsage } from "@/lib/local";

export const dynamic = "force-dynamic";

export async function GET() {
  const usage = getTokenUsage();
  return NextResponse.json({
    fiveHourPct: usage?.fiveHourPct ?? null,
    sevenDayPct: usage?.sevenDayPct ?? null,
    fiveHourResetsAt: usage?.fiveHourResetsAt ?? null,
    sevenDayResetsAt: usage?.sevenDayResetsAt ?? null,
    updatedAt: usage?.updatedAt ?? null,
  });
}
