import { NextResponse } from "next/server";
import { pushCostSnapshot, type DailyCostSnapshot } from "@/lib/redis";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const token = process.env.WHITEBOX_PUSH_TOKEN;
  if (token) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${token}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const body = await req.json() as Partial<DailyCostSnapshot>;
  const { date, totalSpend, byAgent } = body;

  if (!date || totalSpend === undefined || !byAgent) {
    return NextResponse.json({ error: "date, totalSpend, and byAgent required" }, { status: 400 });
  }

  await pushCostSnapshot({ date, totalSpend, byAgent });
  return NextResponse.json({ ok: true, date });
}
