import { NextResponse } from "next/server";
import { getCostHistory } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function GET() {
  const history = await getCostHistory();
  return NextResponse.json({ history, updatedAt: new Date().toISOString() });
}
