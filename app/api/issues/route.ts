import { NextResponse } from "next/server";
import { getRecentTasks } from "@/lib/github";

export const dynamic = "force-dynamic";

export async function GET() {
  const tasks = await getRecentTasks();
  return NextResponse.json({ tasks, updatedAt: new Date().toISOString() });
}
